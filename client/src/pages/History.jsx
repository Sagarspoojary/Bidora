import React from 'react';
import { motion } from 'framer-motion';

export function History() {
  // Mock timeline events (intended to represent future MongoDB audit log trails)
  const timelineEvents = [
    {
      id: 'h1',
      type: 'PLACE_BID',
      title: 'Placed Bid in Arena',
      description: 'Placed bid of $45,000.00 on Aetherius Chronograph - Prototype No. 01.',
      timestamp: 'Today, 1:15 AM',
      icon: '🏷️',
      color: '#3b82f6',
    },
    {
      id: 'h2',
      type: 'CREATE_AUCTION',
      title: 'Created Centerpiece Auction',
      description: 'Successfully registered Aetherius Chronograph for public bidding.',
      timestamp: 'Yesterday, 4:30 PM',
      icon: '💎',
      color: '#8b5cf6',
    },
    {
      id: 'h3',
      type: 'ACCOUNT_CREATED',
      title: 'Account Secured',
      description: 'Credentials validated and authenticated inside Bidora Arena.',
      timestamp: '2 days ago',
      icon: '🔑',
      color: '#10b981',
    }
  ];

  return (
    <motion.div 
      className="dashboard-view-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="dash-welcome-header">
        <h2 className="welcome-title">Activity History</h2>
        <p className="welcome-subtitle">Chronological timeline of your auction activities and account events.</p>
      </header>

      <div className="history-timeline-container glass-card" style={{ padding: '36px', textAlign: 'left' }}>
        <div className="timeline-trail">
          {timelineEvents.map((event, idx) => (
            <motion.div 
              key={event.id} 
              className="timeline-node"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', stiffness: 100 }}
            >
              {/* Vertical line indicator connector */}
              {idx < timelineEvents.length - 1 && <div className="timeline-connector-line"></div>}

              {/* Node Icon */}
              <div className="timeline-node-icon-box" style={{ borderColor: event.color }}>
                <span className="timeline-icon">{event.icon}</span>
              </div>

              {/* Node Details */}
              <div className="timeline-node-details">
                <div className="node-header-row">
                  <h4 className="node-title">{event.title}</h4>
                  <span className="node-time">{event.timestamp}</span>
                </div>
                <p className="node-description">{event.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <p className="mongodb-data-hint">
          💡 This timeline acts as an audit trail. Activity logs will be streamed from MongoDB cluster logs in a later development phase.
        </p>
      </div>
    </motion.div>
  );
}

export default History;
