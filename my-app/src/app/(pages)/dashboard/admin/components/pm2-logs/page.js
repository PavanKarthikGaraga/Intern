// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import styles from './pm2-logs.module.css';

// export default function RemoteAccess() {
//     const [command, setCommand] = useState('');
//     const [history, setHistory] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [currentDir, setCurrentDir] = useState(process.cwd());
//     const [activeProcesses, setActiveProcesses] = useState(new Set());
//     const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
//     const [pendingCommand, setPendingCommand] = useState('');
//     const [mysqlPassword, setMysqlPassword] = useState('');
//     const terminalRef = useRef(null);
//     const commandInputRef = useRef(null);
//     const [isMySQLConnected, setIsMySQLConnected] = useState(false);

//     // Auto-scroll to bottom when new content is added
//     useEffect(() => {
//         if (terminalRef.current) {
//             terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
//         }
//         if (commandInputRef.current) {
//             commandInputRef.current.focus();
//         }
//     }, [history]);

//     const executeCommand = async (e) => {
//         e.preventDefault();
//         if (!command.trim()) return;

//         const currentCommand = command.trim();
//         setCommand('');

//         // If MySQL session is active
//         if (isMySQLConnected) {
//             // Only allow 'exit' or 'quit' to end the session
//             if (['exit', 'quit'].includes(currentCommand.toLowerCase())) {
//                 await runCommand(currentCommand);
//                 setIsMySQLConnected(false);
//                 return;
//             }
//             // Always send as MySQL command (add semicolon if missing)
//             const mysqlCommand = currentCommand.endsWith(';') ? currentCommand : `${currentCommand};`;
//             await runCommand(mysqlCommand);
//             return;
//         }

//         // Check if it's a MySQL command that needs password
//         if (currentCommand.includes('mysql') && currentCommand.includes('-p')) {
//             if (isMySQLConnected) {
//                 setHistory(prev => [...prev, { 
//                     type: 'error', 
//                     content: 'MySQL session already active. Use the existing session.' 
//                 }]);
//                 return;
//             }
//             setShowPasswordPrompt(true);
//             setPendingCommand(currentCommand);
//             return;
//         }

//         await runCommand(currentCommand);
//     };

//     const runCommand = async (cmd, password = null) => {
//         setHistory(prev => [...prev, { type: 'command', content: cmd }]);

//         try {
//             setLoading(true);
//             const response = await fetch('/api/dashboard/admin/pm2-logs', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ 
//                     command: cmd,
//                     password: password,
//                     watch: cmd.trim().toLowerCase().startsWith('select') // Enable watching for SELECT queries
//                 })
//             });
            
//             const data = await response.json();
            
//             if (data.success) {
//                 if (data.currentDir) {
//                     setCurrentDir(data.currentDir);
//                 }

//                 // Handle MySQL shell session
//                 if (cmd.includes('mysql') && data.output?.includes('MySQL process started with ID:')) {
//                     const processId = data.output.split('ID:')[1].split('\n')[0].trim();
//                     setActiveProcesses(prev => new Set([...prev, processId]));
//                     setIsMySQLConnected(true);
//                     setHistory(prev => [...prev, { 
//                         type: 'output', 
//                         content: 'MySQL shell session started. You can now enter MySQL commands directly.'
//                     }]);
//                 } else if (data.output === 'MySQL session already active. Use the existing session.') {
//                     setHistory(prev => [...prev, { 
//                         type: 'output', 
//                         content: data.output
//                     }]);
//                 } else {
//                     setHistory(prev => [...prev, { 
//                         type: 'output', 
//                         content: data.output || 'Command executed successfully',
//                         isTable: data.output?.includes('<table class="mysql-table">')
//                     }]);

//                     // If this is a SELECT query with watching enabled, set up polling
//                     if (cmd.trim().toLowerCase().startsWith('select') && data.output?.includes('Watching for changes')) {
//                         const watcherId = data.output.split('ID:')[1].trim();
//                         const pollInterval = setInterval(async () => {
//                             try {
//                                 const pollResponse = await fetch('/api/dashboard/admin/pm2-logs', {
//                                     method: 'POST',
//                                     headers: {
//                                         'Content-Type': 'application/json',
//                                     },
//                                     body: JSON.stringify({ 
//                                         command: cmd,
//                                         password: password,
//                                         watch: true
//                                     })
//                                 });
                                
//                                 const pollData = await pollResponse.json();
                                
//                                 if (pollData.success && pollData.output) {
//                                     setHistory(prev => {
//                                         // Remove the last output if it was from this query
//                                         const lastOutput = prev[prev.length - 1];
//                                         if (lastOutput.type === 'output' && lastOutput.content.includes('Watching for changes')) {
//                                             return [...prev.slice(0, -1), { 
//                                                 type: 'output', 
//                                                 content: pollData.output,
//                                                 isTable: pollData.output?.includes('<table class="mysql-table">')
//                                             }];
//                                         }
//                                         return [...prev, { 
//                                             type: 'output', 
//                                             content: pollData.output,
//                                             isTable: pollData.output?.includes('<table class="mysql-table">')
//                                         }];
//                                     });
//                                 }
//                             } catch (err) {
//                                 console.error('Polling error:', err);
//                                 clearInterval(pollInterval);
//                             }
//                         }, 5000); // Poll every 5 seconds

//                         // Store the interval ID for cleanup
//                         setActiveProcesses(prev => new Set([...prev, `watcher_${watcherId}`]));
//                     }
//                 }

//                 if (data.error) {
//                     setHistory(prev => [...prev, { 
//                         type: 'error', 
//                         content: data.error 
//                     }]);
//                 }
//             } else {
//                 setHistory(prev => [...prev, { 
//                     type: 'error', 
//                     content: data.error 
//                 }]);
//             }
//         } catch (err) {
//             setHistory(prev => [...prev, { 
//                 type: 'error', 
//                 content: 'Failed to execute command' 
//             }]);
//         } finally {
//             setLoading(false);
//             if (showPasswordPrompt) {
//                 setShowPasswordPrompt(false);
//                 setPendingCommand('');
//                 setMysqlPassword('');
//             }
//         }
//     };

//     const handlePasswordSubmit = (e) => {
//         e.preventDefault();
//         runCommand(pendingCommand, mysqlPassword);
//     };

//     const killProcess = async (processId) => {
//         try {
//             const response = await fetch('/api/dashboard/admin/pm2-logs', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ 
//                     command: processId,
//                     action: 'kill'
//                 })
//             });
            
//             const data = await response.json();
            
//             if (data.success) {
//                 setActiveProcesses(prev => {
//                     const newSet = new Set(prev);
//                     newSet.delete(processId);
//                     return newSet;
//                 });
//                 setHistory(prev => [...prev, { 
//                     type: 'output', 
//                     content: data.output 
//                 }]);
//             } else {
//                 setHistory(prev => [...prev, { 
//                     type: 'error', 
//                     content: data.error 
//                 }]);
//             }
//         } catch (err) {
//             setHistory(prev => [...prev, { 
//                 type: 'error', 
//                 content: 'Failed to kill process' 
//             }]);
//         }
//     };

//     const getPrompt = () => {
//         return `${currentDir} $`;
//     };

//     return (
//         <div className={styles.container}>
//             <div className={styles.header}>
//                 <h1>Remote Access Terminal</h1>
//                 {activeProcesses.size > 0 && (
//                     <div className={styles.activeProcesses}>
//                         <h3>Active Processes:</h3>
//                         {Array.from(activeProcesses).map(processId => (
//                             <div key={processId} className={styles.processItem}>
//                                 <span>Process ID: {processId}</span>
//                                 <button 
//                                     onClick={() => killProcess(processId)}
//                                     className={styles.killButton}
//                                 >
//                                     Kill
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
            
//             <div className={styles.terminal} ref={terminalRef}>
//                 <div className={styles.terminalContent}>
//                     {history.map((item, index) => (
//                         <div key={index} className={`${styles.terminalLine} ${styles[item.type]}`}>
//                             {item.type === 'command' && <span className={styles.prompt}>{getPrompt()}</span>}
//                             {item.isTable ? (
//                                 <div dangerouslySetInnerHTML={{ __html: item.content }} />
//                             ) : (
//                                 <span className={styles.content}>{item.content}</span>
//                             )}
//                         </div>
//                     ))}
//                     {showPasswordPrompt ? (
//                         <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
//                             <div className={styles.inputGroup}>
//                                 <span className={styles.prompt}>Password:</span>
//                                 <input
//                                     type="password"
//                                     name="mysqlPassword"
//                                     autoComplete="off"
//                                     value={mysqlPassword}
//                                     onChange={(e) => setMysqlPassword(e.target.value)}
//                                     className={styles.passwordInput}
//                                     autoFocus
//                                 />
//                             </div>
//                         </form>
//                     ) : (
//                         <form onSubmit={executeCommand} className={styles.commandForm}>
//                             <div className={styles.inputGroup}>
//                                 <span className={styles.prompt}>{getPrompt()}</span>
//                                 <input
//                                     type="text"
//                                     value={command}
//                                     onChange={(e) => setCommand(e.target.value)}
//                                     placeholder="Enter command..."
//                                     className={styles.commandInput}
//                                     disabled={loading}
//                                     ref={commandInputRef}
//                                 />
//                             </div>
//                         </form>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// } 
'use client';
import { useState } from 'react';

export default function PM2Logs() {
    const [password, setPassword] = useState('');

    const handleGenerate = async () => {
        const res = await fetch('/api/generate-password');
        const data = await res.json();
        setPassword(data.password);
    };

    return (
        <div>
            <button onClick={handleGenerate}>Generate Passwords</button>
            {password && <div>Password: {password}</div>}
        </div>
    );
}