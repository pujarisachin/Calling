import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle size={64} className="mx-auto text-text-tertiary mb-6" />
        <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
        <p className="text-xl text-text-secondary mb-2">Page Not Found</p>
        <p className="text-sm text-text-tertiary mb-8">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            fullWidth
          >
            ← Back to Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            fullWidth
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
