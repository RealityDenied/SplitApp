import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Users, DollarSign, PieChart, Shield, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import AvatarSelector from '../components/AvatarSelector';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Create Groups',
      description: 'Organize expenses with friends and family'
    },
    {
      icon: DollarSign,
      title: 'Track Expenses',
      description: 'Split bills equally, by percentage, or custom amounts'
    },
    {
      icon: PieChart,
      title: 'View Balances',
      description: 'See who owes whom at a glance'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      const result = await register(email, password, name, avatarSeed || email);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)' }}>
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-start px-12 pt-16 pb-16" style={{
        background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
      }}>
        <div className="max-w-md mx-auto">
          {/* App Name */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{
                background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
                boxShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
              }}>
                <Sparkles className="w-8 h-8 text-gray-700" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                SplitMint
              </h1>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              Split expenses seamlessly with friends, roommates, and family. 
              Track who owes what, settle up effortlessly.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-4 rounded-lg transition-all duration-200"
                  style={{
                    background: 'linear-gradient(145deg, #ffffff, #f9fafb)',
                    boxShadow: '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
                  }}
                >
                  <div className="p-2 rounded-lg flex-shrink-0" style={{
                    background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)',
                    boxShadow: 'inset 2px 2px 4px #868C8F, inset -2px -2px 4px #ffffff',
                  }}>
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="rounded-2xl p-8" style={{
            background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
            boxShadow: '12px 12px 24px #d1d5db, -12px -12px 24px #ffffff',
            border: '1px solid rgba(134, 140, 143, 0.2)'
          }}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-gray-600">
                {isRegister ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setIsRegister(false);
                        setError('');
                        setAvatarSeed('');
                      }}
                      className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setIsRegister(true);
                        setError('');
                        setAvatarSeed(email || '');
                      }}
                      className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Register
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="space-y-5">
              <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-lg text-sm text-red-700" style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca'
                }}>
                  {error}
                </div>
              )}

              {isRegister && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name (optional)
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, #f9fafb, #f3f4f6)',
                      boxShadow: 'inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff',
                      border: '1px solid rgba(134, 140, 143, 0.2)'
                    }}
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200"
                  style={{
                    background: 'linear-gradient(145deg, #f9fafb, #f3f4f6)',
                    boxShadow: 'inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff',
                    border: '1px solid rgba(134, 140, 143, 0.2)'
                  }}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, #f9fafb, #f3f4f6)',
                      boxShadow: 'inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff',
                      border: '1px solid rgba(134, 140, 143, 0.2)'
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="pt-2">
                  <AvatarSelector
                    currentSeed={avatarSeed || email}
                    onSelect={setAvatarSeed}
                    label="Choose Your Avatar"
                  />
                </div>
              )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  style={{
                    background: 'linear-gradient(145deg, #4b5563, #374151)',
                    boxShadow: '4px 4px 8px #868C8F, -4px -4px 8px #ffffff',
                  }}
                >
                  {isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
