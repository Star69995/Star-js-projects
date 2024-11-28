// config.js
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

// api.js
class AppointmentsAPI {
    static async loadAppointments() {
        try {
            const response = await fetch('appointments.json');
            if (!response.ok) {
                throw new Error('Failed to load appointments');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading appointments:', error);
            return [];
        }
    }

    static async saveAppointments(appointments) {
        try {
            const response = await fetch('/save-appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointments)
            });

            if (!response.ok) {
                throw new Error('Failed to save appointments');
            }

            return true;
        } catch (error) {
            console.error('Error saving appointments:', error);
            return false;
        }
    }
}

// script.js
class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.editingAppointment = null;
        this.initializeForm();
        this.loadAppointments();
    }

    async loadAppointments() {
        this.appointments = await AppointmentsAPI.loadAppointments();
        this.updateAvailabilityTable();
    }

    async saveAppointments() {
        await AppointmentsAPI.saveAppointments(this.appointments);
    }

    initializeForm() {
        // Populate room options
        const roomSelect = document.getElementById('room');
        Object.keys(ROOM_COLORS).forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = `חדר ${room}`;
            roomSelect.appendChild(option);
        });

        // Populate time options
        const timeSelect = document.getElementById('time');
        HOURS.forEach(hour => {
            const option = document.createElement('option');
            option.value = hour;
            option.textContent = hour;
            timeSelect.appendChild(option);
        });

        // Add event listeners
        document.getElementById('date').addEventListener('change', () => this.updateAvailabilityTable());
        document.getElementById('appointmentForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.handleCancel());
    }

    updateAvailabilityTable() {
        const date = document.getElementById('date').value;
        if (!date) return;

        document.getElementById('selectedDate').textContent = new Date(date).toLocaleDateString('he-IL');

        const tableHTML = `
            <div class="table-container">
                <div class="text-right mb-2 font-bold">זמינות חדרים - ${new Date(date).toLocaleDateString('he-IL')}</div>
                <div class="overflow-x-auto">
                    <table class="availability-table">
                        <thead>
                            <tr>
                                <th>שעה</th>
                                ${Object.keys(ROOM_COLORS).map(room =>
            `<th style="background-color: ${ROOM_COLORS[room]}">חדר ${room}</th>`
        ).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${HOURS.map(hour => `
                                <tr>
                                    <td class="font-bold">${hour}</td>
                                    ${Object.keys(ROOM_COLORS).map(room => {
            const appointment = this.appointments.find(
                app => app.date === date && app.time === hour && app.room === room
            );
            return appointment
                ? `<td class="slot-occupied">
                                                <div>${appointment.therapist}</div>
                                                <div class="text-xs">${appointment.duration} דקות</div>
                                                ${appointment.recurrenceType !== 'ONCE'
                    ? `<div class="text-xs">${RECURRENCE_TYPES[appointment.recurrenceType]}</div>`
                    : ''
                }
                                                <div class="appointment-actions">
                                                    <button class="btn-icon btn-edit" onclick="appointmentManager.handleEdit(${appointment.id})" title="ערוך תור">✏️</button>
                                                    <button class="btn-icon btn-delete" onclick="appointmentManager.handleDelete(${appointment.id})" title="מחק תור">🗑️</button>
                                                </div>
                                               </td>`
                : `<td class="slot-available">פנוי</td>`;
        }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('roomAvailability').innerHTML = tableHTML;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = {
            id: this.editingAppointment ? this.editingAppointment.id : Date.now(),
            date: document.getElementById('date').value,
            room: document.getElementById('room').value,
            therapist: document.getElementById('therapist').value,
            time: document.getElementById('time').value,
            duration: document.getElementById('duration').value,
            recurrenceType: document.getElementById('recurrenceType').value,
        };

        if (this.editingAppointment) {
            this.appointments = this.appointments.map(app =>
                app.id === this.editingAppointment.id ? formData : app
            );
        } else {
            this.appointments.push(formData);
        }

        await this.saveAppointments();
        this.resetForm();
        this.updateAvailabilityTable();
    }

    handleEdit(id) {
        const appointment = this.appointments.find(app => app.id === id);
        if (!appointment) return;

        this.editingAppointment = appointment;
        document.getElementById('formTitle').textContent = 'עריכת תור';
        document.getElementById('submitBtn').textContent = 'עדכן תור';
        document.getElementById('cancelBtn').style.display = 'block';

        // Populate form fields
        Object.keys(appointment).forEach(key => {
            const element = document.getElementById(key);
            if (element) element.value = appointment[key];
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async handleDelete(id) {
        if (window.confirm('האם למחוק את התור?')) {
            this.appointments = this.appointments.filter(app => app.id !== id);
            await this.saveAppointments();
            this.updateAvailabilityTable();
        }
    }

    handleCancel() {
        this.resetForm();
    }

    resetForm() {
        this.editingAppointment = null;
        document.getElementById('appointmentForm').reset();
        document.getElementById('formTitle').textContent = 'הוספת תור חדש';
        document.getElementById('submitBtn').textContent = 'הוסף תור';
        document.getElementById('cancelBtn').style.display = 'none';
    }
}

// Initialize the application
let appointmentManager;
document.addEventListener('DOMContentLoaded', () => {
    appointmentManager = new AppointmentManager();
});