'use client';
import { useState, useEffect } from 'react';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, SaveOutlined, YoutubeOutlined, InstagramOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

export default function VideoDump() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newVideo, setNewVideo] = useState({ url: '', title: '', description: '' });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/dashboard/admin/videos');
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
      } else {
        toast.error(data.error || 'Failed to fetch videos');
      }
    } catch (err) {
      toast.error('Error fetching videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = () => {
    if (!newVideo.url) {
      toast.error('URL is required');
      return;
    }
    
    const type = newVideo.url.includes('youtube.com') || newVideo.url.includes('youtu.be') ? 'youtube' : 'instagram';
    setVideos([...videos, { ...newVideo, type }]);
    setNewVideo({ url: '', title: '', description: '' });
  };

  const handleDeleteVideo = (index) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    setVideos(updatedVideos);
  };

  const moveVideo = (index, direction) => {
    const updatedVideos = [...videos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < videos.length) {
      [updatedVideos[index], updatedVideos[newIndex]] = [updatedVideos[newIndex], updatedVideos[index]];
      setVideos(updatedVideos);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/dashboard/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Video dump updated successfully');
        fetchVideos();
      } else {
        toast.error(data.error || 'Failed to update video dump');
      }
    } catch (err) {
      toast.error('Error saving videos');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="video-dump-container">
      <div className="section-header">
        <h1>Video Dump Management</h1>
        <p>Add and arrange guidance videos for students (YouTube & Instagram Reels)</p>
      </div>

      <div className="add-video-form card">
        <h3>Add New Video</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Video URL (YouTube or Instagram)</label>
            <input 
              type="text" 
              placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reels/..."
              value={newVideo.url}
              onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Title (Optional)</label>
            <input 
              type="text" 
              placeholder="Guide to Social Internship"
              value={newVideo.title}
              onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea 
              placeholder="Brief explanation of the video content"
              value={newVideo.description}
              onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
            />
          </div>
        </div>
        <button className="add-btn" onClick={handleAddVideo}>
          <PlusOutlined /> Add to List
        </button>
      </div>

      <div className="video-list card">
        <div className="list-header">
          <h3>Current Videos</h3>
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            <SaveOutlined /> {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {videos.length === 0 ? (
          <p className="no-data">No videos added yet. Add one above.</p>
        ) : (
          <div className="videos-table-container">
            <table className="videos-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Type</th>
                  <th>Video Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video, index) => (
                  <tr key={index}>
                    <td>
                      <div className="order-controls">
                        <button 
                          onClick={() => moveVideo(index, 'up')} 
                          disabled={index === 0}
                          className="move-btn"
                        >
                          <ArrowUpOutlined />
                        </button>
                        <span className="order-num">{index + 1}</span>
                        <button 
                          onClick={() => moveVideo(index, 'down')} 
                          disabled={index === videos.length - 1}
                          className="move-btn"
                        >
                          <ArrowDownOutlined />
                        </button>
                      </div>
                    </td>
                    <td className="video-type">
                      {video.type === 'youtube' ? (
                        <span className="type-badge youtube"><YoutubeOutlined /> YouTube</span>
                      ) : (
                        <span className="type-badge instagram"><InstagramOutlined /> Instagram</span>
                      )}
                    </td>
                    <td className="video-info">
                      <div className="v-title">{video.title || 'Untitled Video'}</div>
                      <div className="v-url">{video.url}</div>
                      {video.description && <div className="v-desc">{video.description}</div>}
                    </td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDeleteVideo(index)}>
                        <DeleteOutlined />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .video-dump-container {
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        .form-group:last-child {
          grid-column: span 2;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .add-btn {
          background: rgb(151, 0, 3);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .save-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .videos-table {
          width: 100%;
          border-collapse: collapse;
        }
        .videos-table th, .videos-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          text-align: left;
        }
        .order-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .move-btn {
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
        }
        .move-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .youtube { background: #ffebee; color: #d32f2f; }
        .instagram { background: #fce4ec; color: #c2185b; }
        .video-info .v-title { font-weight: 600; }
        .video-info .v-url { font-size: 12px; color: #666; word-break: break-all; }
        .video-info .v-desc { font-size: 13px; color: #444; margin-top: 4px; }
        .delete-btn {
          color: #dc3545;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}
