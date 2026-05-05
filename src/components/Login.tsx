import React, { useState } from 'react';
import { User, Mail, Phone, Car, Loader2 } from 'lucide-react';
import './Login.css';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters long.";
    }

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Phone number validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      newErrors.phone = "Please enter exactly 10 digits.";
    }

    // Indian vehicle number validation (e.g., KA 01 AB 1234)
    const carRegex = /^[A-Z]{2}[- \s]?\d{1,2}[- \s]?[A-Z]{1,2}[- \s]?\d{4}$/i;
    if (!carRegex.test(carNumber.trim())) {
      newErrors.carNumber = "Valid format required (e.g., KA 01 AB 1234).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsAuthenticating(true);
      // Simulate network request for dynamic feel
      setTimeout(() => {
        onLogin({ name, email, phone, carNumber });
      }, 1500);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="login-card">
        <div className="login-header stagger-1">
          <div className="logo-container">
            <Car size={36} color="var(--primary-color)" />
          </div>
          <h2>EV Hub OS</h2>
          <p>Driver Authentication Required</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group stagger-2">
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAuthenticating}
                required
              />
            </div>
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="input-group stagger-3">
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="input-field" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAuthenticating}
                required
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group stagger-4">
            <div className="input-with-icon">
              <Phone size={18} className="input-icon" />
              <input 
                type="tel" 
                className="input-field" 
                placeholder="Phone Number (e.g. 9876543210)"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); 
                  setPhone(val);
                }}
                maxLength={10}
                disabled={isAuthenticating}
                required
              />
            </div>
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="input-group stagger-5">
            <div className="input-with-icon">
              <Car size={18} className="input-icon" />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Vehicle Reg. Number (e.g. KA 01 AB 1234)"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                disabled={isAuthenticating}
                required
              />
            </div>
            {errors.carNumber && <span className="error-text">{errors.carNumber}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn stagger-5"
            disabled={isAuthenticating}
            style={{ animationDelay: '0.7s' }}
          >
            {isAuthenticating ? (
              <>
                <Loader2 size={20} className="spinner" />
                Authenticating...
              </>
            ) : (
              'Initialize Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
