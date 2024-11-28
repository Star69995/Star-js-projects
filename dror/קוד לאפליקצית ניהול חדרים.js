import React, { useState } from 'react';

const ROOM_COLORS = {
  1: '#f8d7da',
  2: '#d1e7dd',
  3: '#cfe2ff',
  4: '#e2e3e5',
  5: '#fff3cd',
};

const HOURS = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);

const RECURRENCE_TYPES = {
  ONCE: 'חד פעמי',
  DAILY: 'מדי יום',
  WEEKLY: 'מדי שבוע',
  BIWEEKLY: 'מדי שבועיים',
};

const Button = ({ onClick, className = '', children, title }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded ${className}`}
    title={title}
  >
    {children}
  </button>
);

function RoomAvailability({ date, appointments, onEdit, onDelete }) {
  if (!date) return null;

  return (
    <div className="mb-6 bg-white p-4 rounded shadow">
      <div className="text-right mb-2 font-bold">זמינות חדרים - {new Date(date).toLocaleDateString('he-IL')}</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">שעה</th>
              {Object.keys(ROOM_COLORS).map(room => (
                <th key={room} className="border p-2" style={{ backgroundColor: ROOM_COLORS[room] }}>
                  חדר {room}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour}>
                <td className="border p-2 font-bold">{hour}</td>
                {Object.keys(ROOM_COLORS).map(room => {
                  const appointment = appointments.find(
                    app => app.date === date && app.time === hour && app.room === room
                  );
                  return (
                    <td 
                      key={room} 
                      className={`border p-2 text-center ${appointment ? 'bg-red-100' : 'bg-green-100'}`}
                    >
                      {appointment ? (
                        <div>
                          <div>{appointment.therapist}</div>
                          <div className="text-xs">{appointment.duration} דקות</div>
                          {appointment.recurrenceType !== 'ONCE' && (
                            <div className="text-xs">
                              {RECURRENCE_TYPES[appointment.recurrenceType]}
                            </div>
                          )}
                          <div className="flex justify-center gap-2 mt-2">
                            <button 
                              className="bg-blue-50 hover:bg-blue-100 p-1 rounded"
                              onClick={() => onEdit(appointment)}
                              title="ערוך תור"
                            >
                              ✏️
                            </button>
                            <button 
                              className="bg-red-50 hover:bg-red-100 p-1 rounded"
                              onClick={() => onDelete(appointment.id)}
                              title="מחק תור"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ) : 'פנוי'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RoomScheduler() {
  const [appointments, setAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    room: '',
    therapist: '',
    date: '',
    time: '',
    duration: '60',
    recurrenceType: 'ONCE',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setAppointments(prev => [...prev, { ...newAppointment, id: Date.now() }]);
    setNewAppointment(prev => ({
      ...prev,
      room: '',
      therapist: '',
      time: '',
      duration: '60',
      recurrenceType: 'ONCE',
    }));
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setNewAppointment(appointment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setAppointments(prev => prev.map(app => 
      app.id === editingAppointment.id ? { ...newAppointment, id: app.id } : app
    ));
    setNewAppointment(prev => ({
      ...prev,
      room: '',
      therapist: '',
      time: '',
      duration: '60',
      recurrenceType: 'ONCE',
    }));
    setEditingAppointment(null);
  };

  const handleCancel = () => {
    setEditingAppointment(null);
    setNewAppointment(prev => ({
      ...prev,
      room: '',
      therapist: '',
      time: '',
      duration: '60',
      recurrenceType: 'ONCE',
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm('האם למחוק את התור?')) {
      setAppointments(prev => prev.filter(app => app.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4 text-right">ניהול תורים</h1>

      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingAppointment ? 'עריכת תור' : 'הוספת תור חדש'}
          </h2>
          {newAppointment.date && (
            <div className="text-gray-600">
              {new Date(newAppointment.date).toLocaleDateString('he-IL')}
            </div>
          )}
        </div>

        <form onSubmit={editingAppointment ? handleUpdate : handleSubmit} className="space-y-4">
          <div className="mb-6">
            <label className="block mb-1 text-right">תאריך</label>
            <input
              type="date"
              className="w-full p-2 border rounded text-right"
              value={newAppointment.date}
              onChange={e => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {newAppointment.date && (
            <RoomAvailability 
              date={newAppointment.date}
              appointments={appointments}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-right">חדר</label>
              <select
                className="w-full p-2 border rounded text-right"
                value={newAppointment.room}
                onChange={e => setNewAppointment(prev => ({ ...prev, room: e.target.value }))}
                required
              >
                <option value="">בחר חדר</option>
                {Object.keys(ROOM_COLORS).map(room => (
                  <option key={room} value={room}>חדר {room}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-1 text-right">מטפל</label>
              <input
                type="text"
                className="w-full p-2 border rounded text-right"
                value={newAppointment.therapist}
                onChange={e => setNewAppointment(prev => ({ ...prev, therapist: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-right">שעה</label>
              <select
                className="w-full p-2 border rounded text-right"
                value={newAppointment.time}
                onChange={e => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                required
              >
                <option value="">בחר שעה</option>
                {HOURS.map(hour => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-right">משך</label>
              <select
                className="w-full p-2 border rounded text-right"
                value={newAppointment.duration}
                onChange={e => setNewAppointment(prev => ({ ...prev, duration: e.target.value }))}
              >
                <option value="30">30 דקות</option>
                <option value="45">45 דקות</option>
                <option value="60">60 דקות</option>
                <option value="90">90 דקות</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-right">תדירות</label>
              <select
                className="w-full p-2 border rounded text-right"
                value={newAppointment.recurrenceType}
                onChange={e => setNewAppointment(prev => ({ ...prev, recurrenceType: e.target.value }))}
              >
                {Object.entries(RECURRENCE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="submit"
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              {editingAppointment ? 'עדכן תור' : 'הוסף תור'}
            </button>
            {editingAppointment && (
              <button
                type="button"
                className="px-4 py-2 border rounded hover:bg-gray-100"
                onClick={handleCancel}
              >
                ביטול
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
