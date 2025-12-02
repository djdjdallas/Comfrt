'use client';

export default function ChatBubble({ message, isUser, children }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px'
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '16px 20px',
        borderRadius: '20px',
        backgroundColor: isUser ? '#96a87f' : '#ffffff',
        color: isUser ? '#ffffff' : '#3d3d3d',
        border: isUser ? 'none' : '1px solid #f3f1ed',
        borderBottomRightRadius: isUser ? '6px' : '20px',
        borderBottomLeftRadius: isUser ? '20px' : '6px',
        boxShadow: isUser ? 'none' : '0 2px 8px rgba(61, 61, 61, 0.04)',
      }}>
        {children || (
          <p style={{
            fontSize: '17px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            margin: 0
          }}>{message}</p>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '16px'
    }}>
      <div style={{
        padding: '16px 20px',
        borderRadius: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid #f3f1ed',
        borderBottomLeftRadius: '6px',
        boxShadow: '0 2px 8px rgba(61, 61, 61, 0.04)',
      }}>
        <div style={{ display: 'flex', gap: '8px', padding: '4px 8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#d4cec2',
            animation: 'typingBounce 1.4s ease-in-out infinite',
          }} />
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#d4cec2',
            animation: 'typingBounce 1.4s ease-in-out infinite 0.2s',
          }} />
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#d4cec2',
            animation: 'typingBounce 1.4s ease-in-out infinite 0.4s',
          }} />
        </div>
      </div>
    </div>
  );
}
