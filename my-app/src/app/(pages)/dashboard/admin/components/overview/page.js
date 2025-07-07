'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
// import './page.css';
import { TeamOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './page.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Overview() {
    const { user } = useAuth();
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedGender, setSelectedGender] = useState('all');
    const [showDistrictWise, setShowDistrictWise] = useState(false);
    const [geoSlotFilter, setGeoSlotFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('all');
    const [statsSlotFilter, setStatsSlotFilter] = useState('all');
    const [statsData, setStatsData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [progressStats, setProgressStats] = useState(null);
    const [selectedDay, setSelectedDay] = useState('all');
    const [selectedSlot, setSelectedSlot] = useState('all');
    const [selectedFacultyMentor, setSelectedFacultyMentor] = useState('all');
    const [selectedStudentLead, setSelectedStudentLead] = useState('all');
    const [facultyMentors, setFacultyMentors] = useState([]);
    const [studentLeads, setStudentLeads] = useState([]);

    const fetchOverviewData = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await fetch('/api/dashboard/admin/overview', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch overview data');
            }

            const data = await response.json();
            if (data.success) {
                setOverviewData(data.overviewData);
            } else {
                throw new Error(data.error || 'Failed to fetch overview data');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatsData = async (slot) => {
        try {
            setStatsLoading(true);
            const params = new URLSearchParams();
            if (slot !== 'all') {
                params.append('slot', slot);
            }
            const response = await fetch(`/api/dashboard/admin/overview?${params.toString()}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch statistics');
            }

            const data = await response.json();
            if (data.success) {
                setStatsData(data.overviewData);
            } else {
                throw new Error(data.error || 'Failed to fetch statistics');
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            toast.error(err.message);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.username) {
            fetchOverviewData();
        }
    }, [user]);

    useEffect(() => {
        if (user?.username) {
            fetchStatsData(statsSlotFilter);
        }
    }, [user, statsSlotFilter]);

    useEffect(() => {
        const fetchProgressStats = async () => {
            try {
                // Only proceed if we have a user
                if (!user?.username) return;

                const params = new URLSearchParams();
                
                // Always include the day parameter
                params.append('day', selectedDay);
                
                // Only add other parameters if they are not 'all'
                if (selectedSlot !== 'all') {
                    params.append('slot', selectedSlot);
                }
                if (selectedFacultyMentor !== 'all') {
                    params.append('facultyMentorId', selectedFacultyMentor);
                }
                if (selectedStudentLead !== 'all') {
                    params.append('studentLeadId', selectedStudentLead);
                }

                const queryString = params.toString();
                const url = `/api/dashboard/admin/progress-stats${queryString ? `?${queryString}` : ''}`;

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch progress stats');
                }

                const data = await response.json();
                if (data.success) {
                    setProgressStats(data.stats);
                    setFacultyMentors(data.facultyMentors);
                    setStudentLeads(data.studentLeads);
                } else {
                    throw new Error(data.error || 'Failed to fetch progress stats');
                }
            } catch (err) {
                console.error('Error fetching progress stats:', err);
                toast.error(err.message);
            }
        };

        fetchProgressStats();
    }, [user, selectedDay, selectedSlot, selectedFacultyMentor, selectedStudentLead]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!overviewData) {
        return <div className="no-data">No overview data available</div>;
    }

    const { 
        leadsCount, 
        studentsCount, 
        completedCount,
        facultyCount,
        verificationStats,
        attendanceStats,
        domainStats,
        modeStats,
        slotStats,
        stateStats,
        districtStats 
    } = overviewData;

    // Get unique states for filter
    const states = [...new Set(stateStats.map(stat => stat.state))];

    // Get districts for selected state
    const districts = selectedState 
        ? [...new Set(districtStats
            .filter(stat => stat.state === selectedState)
            .map(stat => stat.district))]
        : [];

    // Prepare data for state/district distribution chart
    const getStateDistributionData = () => {
        // Helper to filter by slot/mode
        const filterBySlotMode = (arr) =>
            arr.filter(stat =>
                (geoSlotFilter === 'all' || String(stat.slot) === String(geoSlotFilter)) &&
                (modeFilter === 'all' || stat.mode === modeFilter)
            );

        if (showDistrictWise && selectedState) {
            // Show all districts for the selected state (aggregate by district name)
            const filtered = filterBySlotMode(districtStats.filter(stat => stat.state === selectedState));
            const districtMap = {};
            filtered.forEach(stat => {
                if (!districtMap[stat.district]) {
                    districtMap[stat.district] = {
                        value: 0,
                        male: 0,
                        female: 0,
                        other: 0
                    };
                }
                districtMap[stat.district].value += Number(stat.count) || 0;
                districtMap[stat.district].male += Number(stat.male) || 0;
                districtMap[stat.district].female += Number(stat.female) || 0;
                districtMap[stat.district].other += Number(stat.other) || 0;
            });
            return Object.entries(districtMap).map(([name, data]) => ({
                name,
                value: data.value,
                male: data.male,
                female: data.female,
                other: data.other
            })).filter(item => item.value > 0);
        } else if (selectedState && selectedDistrict) {
            // Aggregate all slot/mode records for the selected district
            const arr = filterBySlotMode(districtStats.filter(
                stat => stat.state === selectedState && stat.district === selectedDistrict
            ));
            if (!arr.length) return [];
            const totalMale = arr.reduce((sum, stat) => sum + (Number(stat.male) || 0), 0);
            const totalFemale = arr.reduce((sum, stat) => sum + (Number(stat.female) || 0), 0);
            const totalOther = arr.reduce((sum, stat) => sum + (Number(stat.other) || 0), 0);
            return [
                { name: 'Male', value: totalMale },
                { name: 'Female', value: totalFemale },
                { name: 'Other', value: totalOther }
            ];
        } else if (selectedState) {
            // Aggregate all slot/mode records for the selected state
            const arr = filterBySlotMode(stateStats.filter(stat => stat.state === selectedState));
            if (!arr.length) return [];
            const totalMale = arr.reduce((sum, stat) => sum + (Number(stat.male) || 0), 0);
            const totalFemale = arr.reduce((sum, stat) => sum + (Number(stat.female) || 0), 0);
            const totalOther = arr.reduce((sum, stat) => sum + (Number(stat.other) || 0), 0);
            return [
                { name: 'Male', value: totalMale },
                { name: 'Female', value: totalFemale },
                { name: 'Other', value: totalOther }
            ];
        } else {
            // Show all states (aggregate by state name)
            const filtered = filterBySlotMode(stateStats);
            const stateMap = {};
            filtered.forEach(stat => {
                if (!stateMap[stat.state]) {
                    stateMap[stat.state] = {
                        value: 0,
                        male: 0,
                        female: 0,
                        other: 0
                    };
                }
                stateMap[stat.state].value += Number(stat.count) || 0;
                stateMap[stat.state].male += Number(stat.male) || 0;
                stateMap[stat.state].female += Number(stat.female) || 0;
                stateMap[stat.state].other += Number(stat.other) || 0;
            });
            return Object.entries(stateMap).map(([name, data]) => ({
                name,
                value: data.value,
                male: data.male,
                female: data.female,
                other: data.other
            })).filter(item => item.value > 0);
        }
    };

    const stateDistributionData = getStateDistributionData();

    // Filter data based on selected gender (only for gender view)
    const filteredStateDistributionData = (showDistrictWise && selectedState)
        ? stateDistributionData
        : (selectedGender === 'all' 
            ? stateDistributionData 
            : stateDistributionData.map(item => ({
                name: item.name,
                value: item[selectedGender.toLowerCase()] || 0
              })));

    // Calculate total for current filter
    const totalFiltered = filteredStateDistributionData.reduce((sum, item) => sum + item.value, 0);

    // Prepare data for charts
    const completionData = [
        { name: 'Completed', value: completedCount },
        { name: 'In Progress', value: studentsCount - completedCount }
    ];

    const attendanceData = [
        { name: 'Present', value: attendanceStats.total },
        { name: 'Absent', value: studentsCount - attendanceStats.total }
    ];

    const dailyProgressData = [
        { name: 'Day 1', completed: verificationStats.day1, pending: studentsCount - verificationStats.day1 },
        { name: 'Day 2', completed: verificationStats.day2, pending: studentsCount - verificationStats.day2 },
        { name: 'Day 3', completed: verificationStats.day3, pending: studentsCount - verificationStats.day3 },
        { name: 'Day 4', completed: verificationStats.day4, pending: studentsCount - verificationStats.day4 },
        { name: 'Day 5', completed: verificationStats.day5, pending: studentsCount - verificationStats.day5 },
        { name: 'Day 6', completed: verificationStats.day6, pending: studentsCount - verificationStats.day6 },
        { name: 'Day 7', completed: verificationStats.day7, pending: studentsCount - verificationStats.day7 }
    ];

    return (
        <div className="overview-section">
            <h1>Admin Dashboard Overview</h1>
            <p className="role-text">Administrator</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Total Students</h3>
                            <p>{studentsCount}</p>
                        </div>
                        <TeamOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Completed Students</h3>
                            <p>{completedCount}</p>
                        </div>
                        <CheckCircleOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Student Leads</h3>
                            <p>{leadsCount}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Faculty Mentors</h3>
                            <p>{facultyCount}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>
            </div>

            {/* Geographical Distribution at the top, full width */}
            <div className="geo-section">
                <div className="chart-container">
                    <h2>Geographical Distribution</h2>
                    <div className="filters">
                        <div className="filter-group">
                            <label htmlFor="state">State</label>
                            <select
                                id="state"
                                value={selectedState}
                                onChange={(e) => {
                                    setSelectedState(e.target.value);
                                    setSelectedDistrict('');
                                    setShowDistrictWise(false);
                                }}
                            >
                                <option value="">All States</option>
                                {states.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        {selectedState && (
                            <>
                                <div className="filter-group">
                                    <label htmlFor="district">District</label>
                                    <select
                                        id="district"
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        disabled={showDistrictWise}
                                    >
                                        <option value="">All Districts</option>
                                        {districts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className={`district-wise-btn${showDistrictWise ? ' active' : ''}`}
                                        onClick={() => setShowDistrictWise(v => !v)}
                                    >
                                        {showDistrictWise ? 'Show Gender Wise' : 'Show District Wise'}
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="filter-group">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                                disabled={showDistrictWise}
                            >
                                <option value="all">All</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="geoSlot">Slot</label>
                            <select
                                id="geoSlot"
                                value={geoSlotFilter}
                                onChange={e => setGeoSlotFilter(e.target.value)}
                            >
                                <option value="all">All Slots</option>
                                <option value="1">Slot 1</option>
                                <option value="2">Slot 2</option>
                                <option value="3">Slot 3</option>
                                <option value="4">Slot 4</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="mode">Mode</label>
                            <select
                                id="mode"
                                value={modeFilter}
                                onChange={e => setModeFilter(e.target.value)}
                            >
                                <option value="all">All Modes</option>
                                <option value="Remote">Remote</option>
                                <option value="Incampus">Incampus</option>
                                <option value="InVillage">InVillage</option>
                            </select>
                        </div>
                    </div>
                    <div className="total-count">Total: {totalFiltered}</div>
                    {filteredStateDistributionData.length > 0 ? (
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={filteredStateDistributionData}
                                    // margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10 }} 
                                        angle={-15} 
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8">
                                        {filteredStateDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="no-data-message">
                            No data available for the selected filters
                        </div>
                    )}
                </div>
            </div>

            {/* Other charts in a row below */}
            {/* <div className="charts-section charts-row">
                <div className="chart-container">
                    <h2>Completion Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={completionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {completionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h2>Attendance Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h2>Daily Progress</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyProgressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="completed" stroke="#8884d8" />
                            <Line type="monotone" dataKey="pending" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div> */}

           

            {/* <div className="slot-distribution-section">
                <h2>Slot Distribution</h2>
                <div className="distribution-grid">
                    {slotStats.map((slot, index) => (
                        <div key={index} className="distribution-card">
                            <div className="distribution-content">
                                <div>
                                    <h3>Slot {slot.slot}</h3>
                                    <p>Total: {slot.count}</p>
                                    <p>Completed: {slot.completed}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mode-distribution-section">
                <h2>Mode Distribution</h2>
                <div className="distribution-grid">
                    {modeStats.map((mode, index) => (
                        <div key={index} className="distribution-card">
                            <div className="distribution-content">
                                <div>
                                    <h3>{mode.mode}</h3>
                                    <p>Total: {mode.count}</p>
                                    <p>Completed: {mode.completed}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="domain-distribution-section">
                <h2>Domain Distribution</h2>
                <div className="distribution-grid">
                    {domainStats.map((domain, index) => (
                        <div key={index} className="distribution-card">
                            <div className="distribution-content">
                                <div>
                                    <h3>{domain.selectedDomain}</h3>
                                    <p>Total: {domain.count}</p>
                                    <p>Completed: {domain.completed}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div> */}

            <div className="progress-stats-section">
                <h2>Course Statistics</h2>
                <div className="progress-filters">
                    <div className="filter-group">
                        <label htmlFor="statsSlot">Slot</label>
                        <select 
                            id="statsSlot"
                            value={statsSlotFilter} 
                            onChange={(e) => setStatsSlotFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Slots</option>
                            <option value="1">Slot 1</option>
                            <option value="2">Slot 2</option>
                            <option value="3">Slot 3</option>
                            <option value="4">Slot 4</option>
                        </select>
                    </div>
                </div>
                
                {statsLoading ? (
                    <div className="loading">Loading statistics...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    <>
                        <div className="progress-stats-grid">
                            <div className="progress-stat-card">
                                <h3>Total Registered</h3>
                                <p>{statsData?.studentsCount || 0}</p>
                            </div>
                            <div className="progress-stat-card">
                                <h3>Total Participated</h3>
                                <p>{statsData?.totalParticipated || 0}</p>
                            </div>
                            <div className="progress-stat-card">
                                <h3>Total Completed</h3>
                                <p>{statsData?.completedCount || 0}</p>
                            </div>
                            <div className="progress-stat-card">
                                <h3>Total Passed</h3>
                                <p>{statsData?.totalPassed || 0}</p>
                            </div>
                            <div className="progress-stat-card">
                                <h3>Total Failed</h3>
                                <p>{statsData?.totalFailed || 0}</p>
                            </div>
                        </div>

                        <div className="marks-distribution-section">
                            <h2>Marks Distribution</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={[
                                        { range: '90-100', count: statsData?.marksDistribution?.['90_and_above'] || 0 },
                                        { range: '80-89', count: statsData?.marksDistribution?.['80_to_89'] || 0 },
                                        { range: '70-79', count: statsData?.marksDistribution?.['70_to_79'] || 0 },
                                        { range: '60-69', count: statsData?.marksDistribution?.['60_to_69'] || 0 },
                                        { range: '50-59', count: statsData?.marksDistribution?.['50_to_59'] || 0 },
                                        { range: '40-49', count: statsData?.marksDistribution?.['40_to_49'] || 0 },
                                        { range: 'Below 40', count: statsData?.marksDistribution?.['below_40'] || 0 }
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#8884d8" name="Students">
                                        <Cell fill="#4CAF50" />
                                        <Cell fill="#8BC34A" />
                                        <Cell fill="#CDDC39" />
                                        <Cell fill="#FFEB3B" />
                                        <Cell fill="#FFC107" />
                                        <Cell fill="#FF9800" />
                                        <Cell fill="#F44336" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>

            {/* <p className="beta-note">
                Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
            </p> */}
        </div>
    );
}