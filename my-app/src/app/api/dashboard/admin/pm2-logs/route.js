import { NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import path from 'path';

const execAsync = promisify(exec);

// Store current working directory in memory
let currentWorkingDir = process.cwd();

// Store active processes
const activeProcesses = new Map();

// Store active watchers
const activeWatchers = new Map();

// Store previous working directory for MySQL session
let previousWorkingDir = null;

// Function to check if a port is in use
async function isPortInUse(port) {
    try {
        const { stdout } = await execAsync(`lsof -i :${port}`);
        return stdout.length > 0;
            } catch (error) {
        return false;
    }
}

// Function to kill process using a port
async function killProcessOnPort(port) {
    try {
        await execAsync(`lsof -ti :${port} | xargs kill -9`);
        return true;
    } catch (error) {
        return false;
    }
}

// Function to format MySQL output
function formatMySQLOutput(stdout) {
    const lines = stdout.split('\n');
    if (lines.length > 1) {
        // Get headers and data
        const headers = lines[0].split('\t');
        const data = lines.slice(1).map(line => line.split('\t'));
        
        // Create HTML table structure
        let tableHtml = '<table class="mysql-table">';
        
        // Add headers
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // Add data rows
        tableHtml += '<tbody>';
        data.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
                tableHtml += `<td>${cell || 'NULL'}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        return tableHtml;
    }
    return stdout;
}

export async function POST(request) {
    console.log('Remote Access API: Request received');
    try {
        // Verify admin authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');
        console.log('Remote Access API: Access token present:', !!accessToken?.value);

        if (!accessToken?.value) {
            console.log('Remote Access API: No access token found');
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        console.log('Remote Access API: Token decoded, role:', decoded?.role);

        if (!decoded || decoded.role !== 'admin') {
            console.log('Remote Access API: Unauthorized access attempt');
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized access' 
            }, { status: 403 });
        }

        // Get command from request body
        const { command, action, password, watch } = await request.json();
        
        if (!command && !action) {
            return NextResponse.json({
                success: false,
                error: 'No command or action provided'
            }, { status: 400 });
        }

        let output = '';
        let error = null;

        // Handle process management actions
        if (action === 'kill') {
            const processId = command;
            if (activeProcesses.has(processId)) {
                const process = activeProcesses.get(processId);
                process.kill();
                activeProcesses.delete(processId);
                output = `Process ${processId} terminated`;
            } else {
                error = `Process ${processId} not found`;
            }
        } else if (action === 'list') {
            output = Array.from(activeProcesses.keys()).join('\n');
        } else {
            // Handle cd command separately
            if (command.trim().startsWith('cd ')) {
                const newPath = command.trim().slice(3).trim();
                try {
                    const targetPath = path.resolve(currentWorkingDir, newPath);
                    // Verify the path exists and is accessible
                    await execAsync(`cd "${targetPath}" && pwd`);
                    currentWorkingDir = targetPath;
                    output = `Changed directory to: ${currentWorkingDir}`;
                } catch (err) {
                    error = `Failed to change directory: ${err.message}`;
                }
            } else if (command.trim() === 'cd') {
                // Handle 'cd' without arguments - go to home directory
                try {
                    const homeDir = process.env.HOME || process.env.USERPROFILE;
                    currentWorkingDir = homeDir;
                    output = `Changed directory to: ${currentWorkingDir}`;
                } catch (err) {
                    error = `Failed to change directory: ${err.message}`;
                }
            } else if (command.trim() === 'cd ~') {
                // Handle 'cd ~' - go to home directory
                try {
                    const homeDir = process.env.HOME || process.env.USERPROFILE;
                    currentWorkingDir = homeDir;
                    output = `Changed directory to: ${currentWorkingDir}`;
                } catch (err) {
                    error = `Failed to change directory: ${err.message}`;
                }
            } else if (command.trim() === 'cd ..') {
                // Handle 'cd ..' - go to parent directory
                try {
                    const parentDir = path.dirname(currentWorkingDir);
                    await execAsync(`cd "${parentDir}" && pwd`);
                    currentWorkingDir = parentDir;
                    output = `Changed directory to: ${currentWorkingDir}`;
                } catch (err) {
                    error = `Failed to change directory: ${err.message}`;
                }
            } else {
                // Check if this is a MySQL command for an active MySQL session
                const mysqlProcess = Array.from(activeProcesses.entries()).find(([_, proc]) => 
                    proc.isMySQL
                );

                if (mysqlProcess) {
                    const [processId, proc] = mysqlProcess;
                    try {
                        // Handle exit command to end MySQL session
                        if (command.trim().toLowerCase() === 'exit' || command.trim().toLowerCase() === 'quit') {
                            if (activeProcesses.has(processId)) {
                                proc.process.kill();
                                activeProcesses.delete(processId);
                                // Restore the previous working directory
                                if (previousWorkingDir) {
                                    currentWorkingDir = previousWorkingDir;
                                    previousWorkingDir = null;
                                }
                                output = 'Exited MySQL session.';
                                return NextResponse.json({
                                    success: true,
                                    output: output,
                                    error: null,
                                    currentDir: currentWorkingDir
                                });
                            }
                        }

                        // Handle USE command to update current database
                        if (command.trim().toLowerCase().startsWith('use ')) {
                            const dbName = command.trim().slice(4).trim();
                            proc.currentDatabase = dbName;
                            output = `Database changed to: ${dbName}`;
                            return NextResponse.json({
                                success: true,
                                output: output,
                                error: null,
                                currentDir: currentWorkingDir
                            });
                        }

                        // Create a temporary file for the command
                        const tempFile = path.join(currentWorkingDir, `.mysql_cmd_${processId}.sql`);
                        
                        // If we have a current database, add USE statement
                        let fullCommand = command;
                        if (proc.currentDatabase && !command.trim().toLowerCase().startsWith('use ')) {
                            fullCommand = `USE ${proc.currentDatabase};\n${command}`;
                        }
                        
                        // Write command to temporary file
                        await execAsync(`echo "${fullCommand.replace(/"/g, '\\"')}" > "${tempFile}"`);
                        
                        // Create a temporary file for MySQL configuration
                        const configFile = path.join(currentWorkingDir, `.mysql_cnf_${processId}.cnf`);
                        await execAsync(`echo "[client]\nuser=root\npassword=${proc.password}" > "${configFile}"`);
                        
                        // Execute the command through mysql using the config file
                        const mysqlCommand = `mysql --defaults-file="${configFile}" < "${tempFile}"`;
                        const { stdout, stderr } = await execAsync(mysqlCommand, {
                            cwd: currentWorkingDir,
                            env: {
                                ...process.env,
                                PATH: process.env.PATH,
                                HOME: process.env.HOME,
                                USER: process.env.USER,
                                PWD: currentWorkingDir
                            }
                        });
                        
                        // Clean up the temporary files
                        await execAsync(`rm "${tempFile}" "${configFile}"`);
                        
                        if (stdout) {
                            output = formatMySQLOutput(stdout);
                        } else if (stderr && !stderr.includes('Warning: Using a password')) {
                            error = stderr;
                        } else {
                            output = 'Command executed successfully';
                        }
                    } catch (err) {
                        error = `Failed to execute MySQL command: ${err.message}`;
                    }
                } else if (command.includes('mysql')) {
                    try {
                        // Check if there's already an active MySQL session
                        const existingMySQL = Array.from(activeProcesses.entries()).find(([_, proc]) => 
                            proc.isMySQL
                        );

                        if (existingMySQL) {
                            output = 'MySQL session already active. Use the existing session.';
                            return NextResponse.json({
                                success: true,
                                output: output,
                                error: null,
                                currentDir: currentWorkingDir
                            });
                        }

                        // Store the previous working directory and switch to /home/sac/lntern/my-app
                        previousWorkingDir = currentWorkingDir;
                        currentWorkingDir = '/home/sac/';

                        // Create a new process
                        const processId = Date.now().toString();
                        
                        // Create a temporary file for MySQL configuration
                        const configFile = path.join(currentWorkingDir, `.mysql_cnf_${processId}.cnf`);
                        await execAsync(`echo "[client]\nuser=root\npassword=${password}" > "${configFile}"`);
                        
                        // Construct MySQL command using config file
                        const mysqlCommand = `mysql --defaults-file="${configFile}"`;
                        
                        // Create a new MySQL process
                        const childProcess = spawn('bash', ['-c', mysqlCommand], {
                            cwd: currentWorkingDir,
                            env: {
                                ...process.env,
                                PATH: process.env.PATH,
                                HOME: process.env.HOME,
                                USER: process.env.USER,
                                PWD: currentWorkingDir
                            },
                            stdio: ['pipe', 'pipe', 'pipe']
                        });

                        // Store process and its state
                        activeProcesses.set(processId, {
                            process: childProcess,
                            password: password,
                            isMySQL: true,
                            currentDatabase: null
                        });

                        // Handle process output
                        let processOutput = '';
                        childProcess.stdout.on('data', (data) => {
                            processOutput += data.toString();
                            output = processOutput;
                        });

                        childProcess.stderr.on('data', (data) => {
                            processOutput += data.toString();
                            error = data.toString();
                        });

                        childProcess.on('close', (code) => {
                            activeProcesses.delete(processId);
                            // Clean up the config file
                            execAsync(`rm "${configFile}"`).catch(console.error);
                            // Restore the previous working directory
                            if (previousWorkingDir) {
                                currentWorkingDir = previousWorkingDir;
                                previousWorkingDir = null;
                            }
                            output = `MySQL process ${processId} closed with code ${code}`;
                        });

                        output = `MySQL process started with ID: ${processId}\nUse 'kill ${processId}' to stop the process`;
                    } catch (err) {
                        error = `Failed to start MySQL process: ${err.message}`;
                    }
                } else {
                    // Check if this is a MySQL command for an active MySQL session
                    const mysqlProcess = Array.from(activeProcesses.entries()).find(([_, proc]) => 
                        proc.isMySQL
                    );

                    if (mysqlProcess) {
                        const [processId, proc] = mysqlProcess;
                        try {
                            // Handle exit command to end MySQL session
                            if (command.trim().toLowerCase() === 'exit' || command.trim().toLowerCase() === 'quit') {
                                if (activeProcesses.has(processId)) {
                                    proc.process.kill();
                                    activeProcesses.delete(processId);
                                    // Restore the previous working directory
                                    if (previousWorkingDir) {
                                        currentWorkingDir = previousWorkingDir;
                                        previousWorkingDir = null;
                                    }
                                    output = 'Exited MySQL session.';
                                    return NextResponse.json({
                                        success: true,
                                        output: output,
                                        error: null,
                                        currentDir: currentWorkingDir
                                    });
                                }
                            }

                            // Create a temporary file for the command
                            const tempFile = path.join(currentWorkingDir, `.mysql_cmd_${processId}.sql`);
                            
                            // Write command to temporary file
                            await execAsync(`echo "${command.replace(/"/g, '\\"')}" > "${tempFile}"`);
                            
                            // Create a temporary file for MySQL configuration
                            const configFile = path.join(currentWorkingDir, `.mysql_cnf_${processId}.cnf`);
                            await execAsync(`echo "[client]\nuser=root\npassword=${proc.password}" > "${configFile}"`);
                            
                            // Execute the command through mysql using the config file
                            const mysqlCommand = `mysql --defaults-file="${configFile}" < "${tempFile}"`;
                            const { stdout, stderr } = await execAsync(mysqlCommand, {
                                cwd: currentWorkingDir,
                                env: {
                                    ...process.env,
                                    PATH: process.env.PATH,
                                    HOME: process.env.HOME,
                                    USER: process.env.USER,
                                    PWD: currentWorkingDir
                                }
                            });
                            
                            // Clean up the temporary files
                            await execAsync(`rm "${tempFile}" "${configFile}"`);
                            
                            if (stdout) {
                                output = formatMySQLOutput(stdout);
                            } else if (stderr && !stderr.includes('Warning: Using a password')) {
                                error = stderr;
                            } else {
                                output = 'Command executed successfully';
                            }
                        } catch (err) {
                            error = `Failed to execute MySQL command: ${err.message}`;
                        }
                    } else {
                        // Execute other commands
                        try {
                            const { stdout, stderr } = await execAsync(command, {
                                cwd: currentWorkingDir,
                                env: {
                                    ...process.env,
                                    PATH: process.env.PATH,
                                    HOME: process.env.HOME,
                                    USER: process.env.USER,
                                    PWD: currentWorkingDir
                                }
                            });
                            output = stdout || stderr || 'Command executed successfully';
                            error = stderr || null;
                        } catch (err) {
                            error = err.message;
                        }
                    }
                }
            }
        }
        
        return NextResponse.json({
            success: true,
            output: output,
            error: error,
            currentDir: currentWorkingDir
        });

    } catch (error) {
        console.error('Remote Access API: Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to execute command',
            details: error.stack
        }, { status: 500 });
    }
} 