import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const generateId = () => Math.random().toString(16).slice(2);

export default function AnnotationApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState({
    triplets: [],
    users: [
      { id: 'admin_user', name: 'admin', password: 'admin123', role: 'admin' }
    ]
  });

  const login = (name, password) => {
    const user = data.users.find(u => u.name === name && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={login} users={data.users} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header user={currentUser} onLogout={logout} />
      
      {currentUser.role === 'admin' && (
        <AdminDashboard data={data} setData={setData} user={currentUser} />
      )}
      {currentUser.role === 'generator' && (
        <GenerationPage data={data} setData={setData} user={currentUser} />
      )}
      {currentUser.role === 'annotator' && (
        <AnnotationPage data={data} setData={setData} user={currentUser} />
      )}
    </div>
  );
}

function LoginPage({ onLogin, users }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) {
      setError('Please fill in both fields');
      return;
    }
    
    if (!onLogin(userId, password)) {
      setError('Invalid name or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Annotation System</h1>
        <p className="text-center text-gray-600 mb-8 text-sm">({users.length} users registered)</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Annotation System</h1>
        <p className="text-sm text-gray-600">Logged in as <span className="font-semibold">{user.name}</span> ({user.role})</p>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
      >
        <LogOut size={18} /> Logout
      </button>
    </header>
  );
}

function AdminDashboard({ data, setData, user }) {
  const [newContext, setNewContext] = useState('');
  const [target, setTarget] = useState('');
  const [biasType, setBiasType] = useState('race');
  const [csvText, setCsvText] = useState('');
  const [uploadMode, setUploadMode] = useState('single');
  const [userCsvText, setUserCsvText] = useState('');
  const [showUserUpload, setShowUserUpload] = useState(false);

  const addTriplet = () => {
    if (!newContext.trim() || !target.trim()) {
      alert('Please fill context and target');
      return;
    }

    const triplet = {
      id: generateId(),
      target,
      bias_type: biasType,
      context: newContext,
      sentences: [],
      generatorId: null
    };

    setData(prev => ({
      ...prev,
      triplets: [...prev.triplets, triplet]
    }));

    setNewContext('');
    setTarget('');
  };

  const addTripletsFromCSV = () => {
    if (!csvText.trim()) {
      alert('Please paste CSV content');
      return;
    }

    const lines = csvText.split('\n').filter(line => line.trim());
    const newTriplets = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        id: generateId(),
        target: parts[0] || 'Unknown',
        bias_type: parts[1] || 'race',
        context: parts[2] || '',
        sentences: [],
        generatorId: null
      };
    });

    if (newTriplets.length === 0) {
      alert('No valid entries found');
      return;
    }

    setData(prev => ({
      ...prev,
      triplets: [...prev.triplets, ...newTriplets]
    }));

    setCsvText('');
    setUploadMode('single');
    alert(`Successfully added ${newTriplets.length} context entries!`);
  };

  const addUsersFromCSV = () => {
    if (!userCsvText.trim()) {
      alert('Please paste user CSV content');
      return;
    }

    const lines = userCsvText.split('\n').filter(line => line.trim());
    const newUsers = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        return {
          id: parts[0],
          name: parts[1],
          password: parts[2],
          role: parts[3]
        };
      }
      return null;
    }).filter(Boolean);

    if (newUsers.length === 0) {
      alert('No valid user entries found');
      return;
    }

    setData(prev => ({
      ...prev,
      users: [...prev.users, ...newUsers]
    }));

    setUserCsvText('');
    setShowUserUpload(false);
    alert(`Successfully added ${newUsers.length} users!`);
  };

  const downloadJSON = () => {
    const json = JSON.stringify(data.triplets, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
  };

  const totalSentences = data.triplets.reduce((sum, t) => sum + t.sentences.length, 0);
  const totalAnnotations = data.triplets.reduce((sum, t) => 
    sum + t.sentences.reduce((s, sent) => s + sent.labels.length, 0), 0
  );
  const targetAnnotations = totalSentences * 5;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Plus size={24} />} label="Total Triplets" value={data.triplets.length} color="blue" />
          <StatCard icon={<CheckCircle size={24} />} label="Annotations Done" value={totalAnnotations} color="green" />
          <StatCard icon={<Clock size={24} />} label="Target" value={targetAnnotations} color="yellow" />
          <StatCard icon={<Plus size={24} />} label="Total Users" value={data.users.length} color="blue" />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-2">Progress: {totalAnnotations} / {targetAnnotations}</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${targetAnnotations > 0 ? (totalAnnotations / targetAnnotations) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Download size={18} /> Download JSON
          </button>
          <button
            onClick={() => setShowUserUpload(!showUserUpload)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> {showUserUpload ? 'Hide' : 'Add Users'}
          </button>
        </div>

        {showUserUpload && (
          <div className="bg-indigo-50 p-6 rounded-lg mb-6 border-l-4 border-indigo-500">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Upload Users from CSV</h4>
            <textarea
              value={userCsvText}
              onChange={(e) => setUserCsvText(e.target.value)}
              placeholder="Format: user_id | name | password | role&#10;user001 | Alice | pass123 | generator&#10;user002 | Bob | pass456 | annotator"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
              rows="6"
            />
            <div className="bg-white p-3 rounded-lg text-sm text-gray-700 mb-3">
              <p className="font-semibold mb-1">📋 Format (pipe-separated):</p>
              <p>user_id | name | password | role</p>
              <p className="text-xs mt-2">One user per line. Roles: admin, generator, annotator</p>
            </div>
            <button
              onClick={addUsersFromCSV}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Upload Users
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Users</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.users.map(u => (
            <div key={u.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-800">{u.name}</p>
              <p className="text-xs text-gray-600 mt-1">ID: {u.id}</p>
              <p className="text-xs bg-blue-100 text-blue-800 inline-block px-2 py-1 rounded mt-2">{u.role}</p>
            </div>
          ))}
          {data.users.length === 0 && (
            <p className="text-gray-500 text-center col-span-2 py-4">No users added yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Add Context Entries</h3>
        
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setUploadMode('single')}
            className={`px-4 py-2 font-semibold transition ${uploadMode === 'single' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Single Entry
          </button>
          <button
            onClick={() => setUploadMode('csv')}
            className={`px-4 py-2 font-semibold transition ${uploadMode === 'csv' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Bulk Upload (CSV)
          </button>
        </div>

        {uploadMode === 'single' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g., Ethiopia, Women, Tech Workers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bias Type</label>
              <select
                value={biasType}
                onChange={(e) => setBiasType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="race">Race</option>
                <option value="gender">Gender</option>
                <option value="religion">Religion</option>
                <option value="occupation">Occupation</option>
                <option value="age">Age</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Context Sentence</label>
              <textarea
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                placeholder="e.g., Many people live in Ethiopia."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            </div>
            <button
              onClick={addTriplet}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Add Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Format: target | bias_type | context_sentence&#10;Ethiopia | race | Many people live in Ethiopia.&#10;Women | gender | Most women work in healthcare."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows="8"
            />
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
              <p className="font-semibold mb-1">📋 Format (pipe-separated):</p>
              <p>target | bias_type | context_sentence</p>
              <p className="text-xs mt-2">One entry per line</p>
            </div>
            <button
              onClick={addTripletsFromCSV}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Upload Entries
            </button>
          </div>
        )}

        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Pending Entries</h4>
          <div className="space-y-2">
            {data.triplets.filter(t => !t.generatorId).map(triplet => (
              <div key={triplet.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{triplet.target} <span className="text-xs bg-gray-300 px-2 py-1 rounded">{triplet.bias_type}</span></p>
                    <p className="text-sm text-gray-600 mt-1">{triplet.context}</p>
                  </div>
                  <span className="text-xs text-gray-500">Waiting for generator...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerationPage({ data, setData, user }) {
  const [selectedTripletId, setSelectedTripletId] = useState(null);
  const [stereotype, setStereotype] = useState('');
  const [antiStereotype, setAntiStereotype] = useState('');
  const [neutral, setNeutral] = useState('');

  const availableTriplets = data.triplets.filter(t => !t.generatorId);
  const triplet = availableTriplets.find(t => t.id === selectedTripletId) || availableTriplets[0];

  const handleSubmit = () => {
    if (!triplet || !stereotype.trim() || !antiStereotype.trim() || !neutral.trim()) {
      alert('Please fill all fields');
      return;
    }

    const updatedTriplet = {
      ...triplet,
      sentences: [
        { sentence: stereotype, id: generateId(), labels: [] },
        { sentence: antiStereotype, id: generateId(), labels: [] },
        { sentence: neutral, id: generateId(), labels: [] }
      ],
      generatorId: user.id
    };

    setData(prev => ({
      ...prev,
      triplets: prev.triplets.map(t => t.id === triplet.id ? updatedTriplet : t)
    }));

    setStereotype('');
    setAntiStereotype('');
    setNeutral('');
    setSelectedTripletId(null);
  };

  if (availableTriplets.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Tasks Available</h2>
          <p className="text-gray-600">Waiting for admin to add context entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Triplet</h2>

        {triplet && (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
              <p className="text-sm text-gray-600 mb-1">Target: <span className="font-semibold">{triplet.target}</span></p>
              <p className="text-sm text-gray-600 mb-2">Bias Type: <span className="font-semibold">{triplet.bias_type}</span></p>
              <p className="text-sm text-gray-600 mb-2">Context Sentence</p>
              <p className="text-lg font-semibold text-gray-800">{triplet.context}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📌 Stereotype Sentence</label>
                <textarea
                  value={stereotype}
                  onChange={(e) => setStereotype(e.target.value)}
                  placeholder="Write a sentence that reinforces the stereotype..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">✓ Anti-Stereotype Sentence</label>
                <textarea
                  value={antiStereotype}
                  onChange={(e) => setAntiStereotype(e.target.value)}
                  placeholder="Write a sentence that counters the stereotype..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">➖ Unrelated Sentence</label>
                <textarea
                  value={neutral}
                  onChange={(e) => setNeutral(e.target.value)}
                  placeholder="Write an unrelated neutral sentence..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Submit Triplet
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              {availableTriplets.length} tasks remaining
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AnnotationPage({ data, setData, user }) {
  const [selectedTripletId, setSelectedTripletId] = useState(null);
  const [selectedSentenceId, setSelectedSentenceId] = useState(null);

  const tripletsNeedingAnnotation = data.triplets.filter(t => 
    t.sentences.length > 0 && t.sentences.some(s => s.labels.length < 5)
  );

  let currentSentence = null;
  let currentTriplet = null;

  for (let triplet of tripletsNeedingAnnotation) {
    for (let sentence of triplet.sentences) {
      if (sentence.labels.length < 5) {
        const userAlreadyAnnotated = sentence.labels.some(l => l.human_id === user.id);
        if (!userAlreadyAnnotated) {
          currentTriplet = triplet;
          currentSentence = sentence;
          break;
        }
      }
    }
    if (currentSentence) break;
  }

  const handleAnnotate = (label) => {
    if (!currentTriplet || !currentSentence) return;

    setData(prev => ({
      ...prev,
      triplets: prev.triplets.map(t => {
        if (t.id === currentTriplet.id) {
          return {
            ...t,
            sentences: t.sentences.map(s => {
              if (s.id === currentSentence.id) {
                return {
                  ...s,
                  labels: [...s.labels, { label, human_id: user.id }]
                };
              }
              return s;
            })
          };
        }
        return t;
      })
    }));
  };

  if (!currentSentence || !currentTriplet) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h2>
          <p className="text-gray-600">You've completed all available annotations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Annotate Sentence</h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600 mb-1">Target: <span className="font-semibold">{currentTriplet.target}</span></p>
          <p className="text-sm text-gray-600 mb-2">Context</p>
          <p className="font-semibold text-gray-800">{currentTriplet.context}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-2">Sentence to Annotate ({currentSentence.labels.length}/5 done)</p>
          <p className="text-lg font-semibold text-gray-800">{currentSentence.sentence}</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-4 font-semibold">How would you label this?</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleAnnotate('stereotype')}
              className="bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-semibold"
            >
              📌 Stereotype
            </button>
            <button
              onClick={() => handleAnnotate('anti-stereotype')}
              className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              ✓ Anti-Stereotype
            </button>
            <button
              onClick={() => handleAnnotate('unrelated')}
              className="bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition font-semibold"
            >
              ➖ Unrelated
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className={`${colorMap[color]} rounded-lg p-6`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}