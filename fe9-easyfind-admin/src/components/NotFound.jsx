import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '70vh', 
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ fontSize: '100px', marginBottom: '20px' }}>🔍</div>
        
        <h1 style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: '#1976d2',
          margin: '0 0 20px 0'
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#333',
          marginBottom: '16px'
        }}>
          Page Not Found
        </h2>

        <p style={{
          color: '#666',
          marginBottom: '32px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Oops! The page you're looking for doesn't exist. 
          It might have been moved or deleted.
        </p>

        <button
          onClick={() => navigate('/admin')}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
        >
          🏠 Go Back Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
