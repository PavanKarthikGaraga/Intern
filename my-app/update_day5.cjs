const fs = require('fs');
const file = 'src/app/(pages)/dashboard/student/_components/dailyTasks/page.js';
let content = fs.readFileSync(file, 'utf8');

const target = `                   <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #e0e0e0' }}>
                     <div className="dt-textarea-wrap" style={{ marginBottom: 20 }}>
                       <label htmlFor={\`day5-topProblems-\${day}\`}>1. Top 3 Problems Identified</label>
                       <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>Based on the severity (YES percentages), list the top 3 problems. (Minimum 50 words)</p>
                       <textarea
                         id={\`day5-topProblems-\${day}\`} className="dt-textarea"
                         placeholder="List the top 3 problems here..."
                         value={data[\`day\${day}_topProblems\`] || ''} readOnly={readOnly}
                         onChange={e => !readOnly && onChange(\`day\${day}_topProblems\`, e.target.value)}
                         style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 100 } : { minHeight: 100 }}
                       />
                       <p className={\`dt-word-count \${pCount >= 50 ? 'ok' : pCount > 0 ? 'warn' : ''}\`}>
                         {pCount} / 50 words minimum {pCount >= 50 ? '✓' : ''}
                       </p>
                     </div>
                     
                     <div className="dt-textarea-wrap" style={{ marginBottom: 20 }}>
                       <label htmlFor={\`day5-rootCauses-\${day}\`}>2. Root Causes Analysis</label>
                       <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>Identify root causes (e.g., Skill gap, Lack of awareness, Infrastructure issues). (Minimum 50 words)</p>
                       <textarea
                         id={\`day5-rootCauses-\${day}\`} className="dt-textarea"
                         placeholder="Write the identified root causes here..."
                         value={data[\`day\${day}_rootCauses\`] || ''} readOnly={readOnly}
                         onChange={e => !readOnly && onChange(\`day\${day}_rootCauses\`, e.target.value)}
                         style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 100 } : { minHeight: 100 }}
                       />
                       <p className={\`dt-word-count \${rCount >= 50 ? 'ok' : rCount > 0 ? 'warn' : ''}\`}>
                         {rCount} / 50 words minimum {rCount >= 50 ? '✓' : ''}
                       </p>
                     </div>

                     <div className="dt-textarea-wrap" style={{ marginBottom: 8 }}>
                       <label htmlFor={\`day5-recommendations-\${day}\`}>3. Recommendations &amp; Improvement Suggestions</label>
                       <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>Provide suitable recommendations or improvement suggestions based on the identified problems and root causes that may help improve the current community situation. (Minimum 50 words)</p>
                       <textarea
                         id={\`day5-recommendations-\${day}\`} className="dt-textarea"
                         placeholder="Write your recommendations here..."
                         value={data[\`day\${day}_recommendations\`] || ''} readOnly={readOnly}
                         onChange={e => !readOnly && onChange(\`day\${day}_recommendations\`, e.target.value)}
                         style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 100 } : { minHeight: 100 }}
                       />
                       <p className={\`dt-word-count \${sCount >= 50 ? 'ok' : sCount > 0 ? 'warn' : ''}\`}>
                         {sCount} / 50 words minimum {sCount >= 50 ? '✓' : ''}
                       </p>
                     </div>
                   </div>`;

const replacement = `                   <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #e0e0e0' }}>
                     <h5 style={{ margin: '0 0 16px 0', color: '#0d47a1', fontSize: '1.1rem' }}>
                       📝 Consolidated Stakeholder Report
                     </h5>
                     <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden' }}>
                       
                       {/* Part 1: Problems */}
                       <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                         <label htmlFor={\`day5-topProblems-\${day}\`} style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 4 }}>Part 1: Core Problems Identified</label>
                         <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12, marginTop: 0 }}>Based on the survey statistics above, detail the top problems facing this stakeholder.</p>
                         <textarea
                           id={\`day5-topProblems-\${day}\`}
                           placeholder="Write Part 1 here..."
                           value={data[\`day\${day}_topProblems\`] || ''} readOnly={readOnly}
                           onChange={e => !readOnly && onChange(\`day\${day}_topProblems\`, e.target.value)}
                           style={{ width: '100%', minHeight: 120, padding: 12, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none', background: readOnly ? '#f1f5f9' : '#fff', resize: 'vertical' }}
                         />
                         <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: 6, color: pCount >= 50 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                           {pCount} words (Min 50) {pCount >= 50 ? '✓' : ''}
                         </div>
                       </div>

                       {/* Part 2: Root Causes */}
                       <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                         <label htmlFor={\`day5-rootCauses-\${day}\`} style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 4 }}>Part 2: Root Cause Analysis</label>
                         <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12, marginTop: 0 }}>Analyze and explain the underlying root causes for these problems.</p>
                         <textarea
                           id={\`day5-rootCauses-\${day}\`}
                           placeholder="Write Part 2 here..."
                           value={data[\`day\${day}_rootCauses\`] || ''} readOnly={readOnly}
                           onChange={e => !readOnly && onChange(\`day\${day}_rootCauses\`, e.target.value)}
                           style={{ width: '100%', minHeight: 120, padding: 12, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none', background: readOnly ? '#f1f5f9' : '#fff', resize: 'vertical' }}
                         />
                         <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: 6, color: rCount >= 50 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                           {rCount} words (Min 50) {rCount >= 50 ? '✓' : ''}
                         </div>
                       </div>

                       {/* Part 3: Recommendations */}
                       <div style={{ padding: '16px', background: '#f8fafc' }}>
                         <label htmlFor={\`day5-recommendations-\${day}\`} style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 4 }}>Part 3: Strategic Recommendations</label>
                         <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12, marginTop: 0 }}>Provide your final recommendations and suggested interventions for government submission.</p>
                         <textarea
                           id={\`day5-recommendations-\${day}\`}
                           placeholder="Write Part 3 here..."
                           value={data[\`day\${day}_recommendations\`] || ''} readOnly={readOnly}
                           onChange={e => !readOnly && onChange(\`day\${day}_recommendations\`, e.target.value)}
                           style={{ width: '100%', minHeight: 120, padding: 12, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none', background: readOnly ? '#f1f5f9' : '#fff', resize: 'vertical' }}
                         />
                         <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: 6, color: sCount >= 50 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                           {sCount} words (Min 50) {sCount >= 50 ? '✓' : ''}
                         </div>
                       </div>

                     </div>
                   </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("File updated successfully.");
