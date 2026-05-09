'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TeamOutlined, CheckCircleOutlined, UserOutlined, SolutionOutlined, ReloadOutlined,
  GlobalOutlined, BarChartOutlined, HomeOutlined, CarOutlined
} from '@ant-design/icons';
import './page.css';

const GEO_COLORS = [
  '#014a01','#1b8f2d','#2e7d32','#388e3c','#43a047',
  '#558b2f','#689f38','#7cb342','#9ccc65','#aed581'
];
const MARKS_COLORS = {
  '95–100':'#014a01','90–95':'#1b8f2d','80–89':'#4caf50',
  '70–79':'#f9a825','60–69':'#fb8c00','Below 60':'#e53935'
};
const SLOT_OPTS = [
  { v:'all', l:'All Slots' },
  { v:'1', l:'Slot 1 — May 11–17' }, { v:'2', l:'Slot 2 — May 18–24' },
  { v:'3', l:'Slot 3 — May 25–31' }, { v:'4', l:'Slot 4 — Jun 1–7' },
  { v:'5', l:'Slot 5 — Jun 8–14' }, { v:'6', l:'Slot 6 — Jun 15–21' },
  { v:'7', l:'Slot 7 — Jun 22–28' }, { v:'8', l:'Slot 8 — Jun 29–Jul 5' },
  { v:'9', l:'Slot 9 — Jul 6–12' },
];

/* ── Custom Pie label (outer) ── */
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  if (percent < 0.03) return null; // hide tiny slices
  const r = outerRadius + 28;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#333" textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central" fontSize={11} fontWeight={600} fontFamily="Inter, sans-serif">
      {name} ({(percent * 100).toFixed(1)}%)
    </text>
  );
};

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background:'#fff', border:'1.5px solid #d0e8d0', borderRadius:10,
      padding:'10px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
      fontFamily:'Inter, sans-serif'
    }}>
      <div style={{ fontWeight:700, color:'#014a01', marginBottom:4 }}>{name}</div>
      <div style={{ fontSize:'0.88rem', color:'#333' }}>
        <strong>{value}</strong> students &nbsp;
        <span style={{ color:'#888' }}>({total ? ((value/total)*100).toFixed(1) : 0}%)</span>
      </div>
    </div>
  );
};

/* ── Custom legend ── */
const CustomLegend = ({ data, total }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:180, paddingLeft:24 }}>
    {data.map((d, i) => (
      <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:12, height:12, borderRadius:3, background:GEO_COLORS[i % GEO_COLORS.length], flexShrink:0 }} />
        <div style={{ flex:1, fontSize:'0.82rem', color:'#333', fontWeight:500 }}>{d.name}</div>
        <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#014a01', minWidth:28, textAlign:'right' }}>{d.value}</div>
        <div style={{ fontSize:'0.75rem', color:'#aaa', minWidth:42, textAlign:'right' }}>
          {total ? ((d.value/total)*100).toFixed(1) : 0}%
        </div>
      </div>
    ))}
  </div>
);

export default function Overview() {
  const { user } = useAuth();
  const [overviewData, setOverviewData]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [statsData, setStatsData]         = useState(null);
  const [statsLoading, setStatsLoading]   = useState(false);
  const [statsSlotFilter, setStatsSlotFilter] = useState('all');

  const [selectedState, setSelectedState]       = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedGender, setSelectedGender]     = useState('all');
  const [showDistrictWise, setShowDistrictWise] = useState(false);
  const [geoSlotFilter, setGeoSlotFilter]       = useState('all');
  const [modeFilter, setModeFilter]             = useState('all');
  const [activeIndex, setActiveIndex]           = useState(null);

  const fetchOverviewData = async () => {
    try {
      setError(null); setLoading(true);
      const res = await fetch('/api/dashboard/admin/overview', { credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
      const data = await res.json();
      if (data.success) setOverviewData(data.overviewData);
      else throw new Error(data.error);
    } catch (err) { setError(err.message); toast.error(err.message); }
    finally { setLoading(false); }
  };

  const fetchStatsData = async (slot) => {
    try {
      setStatsLoading(true);
      const params = slot !== 'all' ? `?slot=${slot}` : '';
      const res = await fetch(`/api/dashboard/admin/overview${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStatsData(data.overviewData);
    } catch (err) { toast.error(err.message); }
    finally { setStatsLoading(false); }
  };

  useEffect(() => { if (user?.username) fetchOverviewData(); }, [user]);
  useEffect(() => { if (user?.username) fetchStatsData(statsSlotFilter); }, [user, statsSlotFilter]);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (error)   return <div className="error">{error}</div>;
  if (!overviewData) return <div className="no-data">No data available</div>;

  const { leadsCount, studentsCount, completedCount, facultyCount, stateStats, districtStats, residenceStats } = overviewData;
  const states = [...new Set(stateStats.map(s => s.state))];
  const districts = selectedState
    ? [...new Set(districtStats.filter(s => s.state === selectedState).map(s => s.district))]
    : [];

  const filterBySlotMode = arr =>
    arr.filter(s =>
      (geoSlotFilter === 'all' || String(s.slot) === geoSlotFilter) &&
      (modeFilter    === 'all' || s.mode === modeFilter)
    );

  const buildGeoData = () => {
    if (showDistrictWise && selectedState) {
      const filtered = filterBySlotMode(districtStats.filter(s => s.state === selectedState));
      const map = {};
      filtered.forEach(s => {
        if (!map[s.district]) map[s.district] = { value:0, male:0, female:0, other:0 };
        map[s.district].value  += Number(s.count)  || 0;
        map[s.district].male   += Number(s.male)   || 0;
        map[s.district].female += Number(s.female) || 0;
        map[s.district].other  += Number(s.other)  || 0;
      });
      return Object.entries(map).map(([name, d]) => ({ name, ...d })).filter(r => r.value > 0);
    }
    if (selectedState && selectedDistrict) {
      const arr = filterBySlotMode(districtStats.filter(s => s.state === selectedState && s.district === selectedDistrict));
      if (!arr.length) return [];
      return [
        { name:'Male',   value: arr.reduce((a,s) => a + (Number(s.male)||0),   0) },
        { name:'Female', value: arr.reduce((a,s) => a + (Number(s.female)||0), 0) },
        { name:'Other',  value: arr.reduce((a,s) => a + (Number(s.other)||0),  0) },
      ];
    }
    if (selectedState) {
      const arr = filterBySlotMode(stateStats.filter(s => s.state === selectedState));
      if (!arr.length) return [];
      return [
        { name:'Male',   value: arr.reduce((a,s) => a + (Number(s.male)||0),   0) },
        { name:'Female', value: arr.reduce((a,s) => a + (Number(s.female)||0), 0) },
        { name:'Other',  value: arr.reduce((a,s) => a + (Number(s.other)||0),  0) },
      ];
    }
    const filtered = filterBySlotMode(stateStats);
    const map = {};
    filtered.forEach(s => {
      if (!map[s.state]) map[s.state] = { value:0, male:0, female:0, other:0 };
      map[s.state].value  += Number(s.count)  || 0;
      map[s.state].male   += Number(s.male)   || 0;
      map[s.state].female += Number(s.female) || 0;
      map[s.state].other  += Number(s.other)  || 0;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).filter(r => r.value > 0);
  };

  const geoData = buildGeoData();
  const filteredGeoData = (showDistrictWise && selectedState)
    ? geoData
    : selectedGender === 'all'
      ? geoData
      : geoData.map(r => ({ name: r.name, value: r[selectedGender.toLowerCase()] || 0 }));
  const totalFiltered = filteredGeoData.reduce((a, r) => a + r.value, 0);

  const marksData = [
    { range:'95–100', count: statsData?.marksDistribution?.['95_to_100'] || 0, color: MARKS_COLORS['95–100'] },
    { range:'90–95',  count: statsData?.marksDistribution?.['90_to_95']  || 0, color: MARKS_COLORS['90–95'] },
    { range:'80–89',  count: statsData?.marksDistribution?.['80_to_89']  || 0, color: MARKS_COLORS['80–89'] },
    { range:'70–79',  count: statsData?.marksDistribution?.['70_to_79']  || 0, color: MARKS_COLORS['70–79'] },
    { range:'60–69',  count: statsData?.marksDistribution?.['60_to_69']  || 0, color: MARKS_COLORS['60–69'] },
    { range:'Below 60', count: statsData?.marksDistribution?.['below_60'] || 0, color: MARKS_COLORS['Below 60'] },
  ];
  const maxMarks = Math.max(...marksData.map(r => r.count), 1);

  const kpiCards = [
    { label:'Total Students',  value: studentsCount,  Icon: TeamOutlined,         color:'#014a01', bg:'#e6f4ea' },
    { label:'Completed',       value: completedCount, Icon: CheckCircleOutlined,   color:'#1565c0', bg:'#e3f2fd' },
    { label:'Student Leads',   value: leadsCount,     Icon: SolutionOutlined,      color:'#6a1b9a', bg:'#f3e5f5' },
    { label:'Faculty Mentors', value: facultyCount,   Icon: UserOutlined,          color:'#e65100', bg:'#fff3e0' },
  ];

  return (
    <div className="overview-section">
      {/* ── Header ── */}
      <div className="ov-header">
        <div className="ov-header-left">
          <h1>Admin Dashboard Overview</h1>
          <p>Real-time data · Last refreshed just now</p>
        </div>
        <button className="ov-refresh-btn"
          onClick={() => { fetchOverviewData(); fetchStatsData(statsSlotFilter); }}>
          <ReloadOutlined /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="ov-kpi-grid">
        {kpiCards.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="ov-kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bg }}>
            <div className="ov-kpi-icon">
              <Icon style={{ fontSize: '1.4rem', color }} />
            </div>
            <div className="ov-kpi-info">
              <h4>{label}</h4>
              <p>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Geographical Distribution ── */}
      <div className="ov-section-card">
        <h2 className="ov-section-title">
          <GlobalOutlined style={{ fontSize:'1.1rem', color:'#014a01' }} />
          Geographical Distribution
        </h2>

        <div className="ov-filters">
          <div className="ov-filter-group">
            <label>State</label>
            <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedDistrict(''); setShowDistrictWise(false); }}>
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {selectedState && (
            <>
              <div className="ov-filter-group">
                <label>District</label>
                <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={showDistrictWise}>
                  <option value="">All Districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="ov-filter-group" style={{ alignSelf:'flex-end' }}>
                <label style={{ opacity:0 }}>_</label>
                <button className={`ov-toggle-btn${showDistrictWise ? ' active' : ''}`}
                  onClick={() => setShowDistrictWise(v => !v)}>
                  {showDistrictWise ? 'District View ON' : 'Show District-Wise'}
                </button>
              </div>
            </>
          )}
          <div className="ov-filter-group">
            <label>Gender</label>
            <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} disabled={showDistrictWise}>
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="ov-filter-group">
            <label>Slot</label>
            <select value={geoSlotFilter} onChange={e => setGeoSlotFilter(e.target.value)}>
              {SLOT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="ov-filter-group">
            <label>Mode</label>
            <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
              <option value="all">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Incampus">In Campus</option>
              <option value="InVillage">In Village</option>
            </select>
          </div>
        </div>

        <div className="ov-total-badge">
          Total: <strong style={{ marginLeft:4 }}>{totalFiltered}</strong>&nbsp;students
        </div>

        {filteredGeoData.length > 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:0, width:'100%' }}>
            {/* Pie */}
            <div style={{ flex:'0 0 380px', height:340 }}>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={filteredGeoData}
                    cx="50%" cy="50%"
                    innerRadius={72}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    stroke="none"
                  >
                    {filteredGeoData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={GEO_COLORS[i % GEO_COLORS.length]}
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.55}
                        style={{ cursor:'pointer', transition:'opacity 0.2s' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip total={totalFiltered} />} />
                  {/* Donut centre label */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily:'Inter, sans-serif' }}>
                    <tspan x="50%" dy="-8" fontSize={28} fontWeight={800} fill="#012a01">{totalFiltered}</tspan>
                    <tspan x="50%" dy={22} fontSize={12} fontWeight={500} fill="#888">Students</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom legend */}
            <div style={{ flex:1, overflowY:'auto', maxHeight:320 }}>
              <CustomLegend data={filteredGeoData} total={totalFiltered} />
            </div>
          </div>
        ) : (
          <div className="no-data-message">No data for selected filters</div>
        )}
      </div>

      {/* ── Course Statistics ── */}
      <div className="ov-section-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <h2 className="ov-section-title" style={{ margin:0, borderBottom:'none', paddingBottom:0 }}>
            <BarChartOutlined style={{ fontSize:'1.1rem', color:'#014a01' }} />
            Course Statistics
          </h2>
          <div className="ov-filter-group" style={{ minWidth:200, maxWidth:260 }}>
            <label>Filter by Slot</label>
            <select value={statsSlotFilter} onChange={e => setStatsSlotFilter(e.target.value)}>
              {SLOT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ borderBottom:'2px solid #f0f7f0', marginBottom:20, marginTop:14 }} />

        {statsLoading ? (
          <div className="loading">Loading statistics…</div>
        ) : (
          <>
            <div className="ov-course-grid">
              <div className="ov-course-card">
                <h4>Total Registered</h4>
                <p>{statsData?.studentsCount || 0}</p>
              </div>
              <div className="ov-course-card blue">
                <h4>Total Participated</h4>
                <p>{statsData?.totalParticipated || 0}</p>
              </div>
              <div className="ov-course-card">
                <h4>Total Passed</h4>
                <p>{statsData?.totalPassed || 0}</p>
              </div>
              <div className="ov-course-card red">
                <h4>Total Failed</h4>
                <p>{statsData?.totalFailed || 0}</p>
              </div>
            </div>

            <h3 style={{ fontWeight:700, color:'#012a01', fontSize:'0.9rem', margin:'0 0 16px', letterSpacing:'0.04em', textTransform:'uppercase' }}>
              Marks Distribution
            </h3>
            <div className="ov-marks-bar-row">
              {marksData.map(({ range, count, color }) => {
                const pct = Math.round((count / maxMarks) * 100);
                return (
                  <div key={range} className="ov-marks-row">
                    <span className="ov-marks-label">{range}</span>
                    <div className="ov-marks-bar-wrap">
                      <div className="ov-marks-bar-fill"
                        style={{ width:`${pct}%`, background:color, minWidth: count > 0 ? 40 : 0 }}>
                        {count > 0 && count}
                      </div>
                    </div>
                    <span className="ov-marks-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Residence Statistics (In-Campus) ── */}
      <div className="ov-section-card">
        <h2 className="ov-section-title">
          <HomeOutlined style={{ fontSize:'1.1rem', color:'#014a01' }} />
          Residence & Transport (In-Campus Students Only)
        </h2>
        
        <div className="ov-table-container" style={{ overflowX:'auto' }}>
          <table className="ov-data-table" style={{ width:'100%', borderCollapse:'collapse', marginTop:10 }}>
            <thead>
              <tr style={{ textAlign:'left', borderBottom:'2px solid #f0f7f0' }}>
                <th style={{ padding:'12px 16px', fontSize:'0.75rem', textTransform:'uppercase', color:'#888' }}>Slot</th>
                <th style={{ padding:'12px 16px', fontSize:'0.75rem', textTransform:'uppercase', color:'#888' }}>Accommodation Opted</th>
                <th style={{ padding:'12px 16px', fontSize:'0.75rem', textTransform:'uppercase', color:'#888' }}>Transportation Opted</th>
              </tr>
            </thead>
            <tbody>
              {residenceStats?.map(s => (
                <tr key={s.slot} style={{ borderBottom:'1px solid #f8fdf8' }}>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:'#012a01' }}>Slot {s.slot}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <HomeOutlined style={{ color:'#1565c0' }} />
                      <span style={{ 
                        padding:'4px 12px', borderRadius:20, background:'#e3f2fd', color:'#1565c0', 
                        fontSize:'0.82rem', fontWeight:600 
                      }}>
                        {s.accommodationCount} Students
                      </span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <CarOutlined style={{ color:'#e65100' }} />
                      <span style={{ 
                        padding:'4px 12px', borderRadius:20, background:'#fff3e0', color:'#e65100', 
                        fontSize:'0.82rem', fontWeight:600 
                      }}>
                        {s.transportationCount} Students
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {(!residenceStats || residenceStats.length === 0) && (
                <tr>
                  <td colSpan="3" style={{ padding:'24px', textAlign:'center', color:'#aaa' }}>No residence data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}