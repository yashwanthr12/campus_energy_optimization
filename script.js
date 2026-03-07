/**
 * Campus Energy Optimization System - Main Script
 */

document.addEventListener('DOMContentLoaded', () => {
    let detailedChart;

    // ----------------------------------------------------
    // Theme Toggling Logic
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcons('dark');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
        
        updateThemeIcons(newTheme);
    });

    function updateThemeIcons(theme) {
        if (theme === 'dark') {
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'block';
        } else {
            darkIcon.style.display = 'block';
            lightIcon.style.display = 'none';
        }
    }

    // ----------------------------------------------------
    // Navigation Logic & View Switching
    // ----------------------------------------------------
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor jump
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add to clicked link
            e.currentTarget.classList.add('active');

            // Get target view id from href (e.g., #dashboard -> view-dashboard)
            const targetId = e.currentTarget.getAttribute('href').substring(1);
            const viewId = `view-${targetId}`;

            // Hide all views
            viewSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show target view if it exists
            const targetView = document.getElementById(viewId);
            if(targetView) {
                targetView.style.display = 'flex'; // Use flex to maintain layout
                // Small timeout to allow display:block to apply before adding class for animation
                setTimeout(() => targetView.classList.add('active'), 10);
            }
        });
    });

    // ----------------------------------------------------
    // Feature 1: Live Dashboard Stats (Connected to API)
    // ----------------------------------------------------
    const counters = document.querySelectorAll('.counter');
    
    function animateValue(obj, start, end, duration, isInteger = false) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let val = progress * (end - start) + start;
            if (isInteger) val = Math.round(val);
            
            obj.innerHTML = val.toLocaleString(undefined, { maximumFractionDigits: isInteger ? 0 : 1 });
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    async function fetchDashboardStats() {
        try {
            const response = await fetch('http://localhost:8000/api/status');
            const data = await response.json();
            
            counters.forEach(counter => {
                const metric = counter.getAttribute('data-metric');
                const currentValue = parseFloat(counter.innerText.replace(/,/g, '')) || 0;
                let newValue = 0;
                
                if (metric === 'usage') newValue = data.total_usage;
                if (metric === 'saved') newValue = data.energy_saved;
                if (metric === 'carbon') newValue = data.carbon_reduction;
                if (metric === 'active') newValue = data.active_rooms;
                if (metric === 'idle') newValue = data.idle_rooms;
                
                const isInteger = (metric === 'active' || metric === 'idle');
                
                if (currentValue !== newValue) {
                    animateValue(counter, currentValue, newValue, 1000, isInteger);
                }
            });
            
            // Also update current usage text if exists
            const currentUsageElement = document.querySelector('.current-usage strong');
            if(currentUsageElement) {
                currentUsageElement.innerText = `${data.current_mw} MW`;
            }
            
        } catch(error) {
            console.error("Dashboard Stats fetch error", error);
        }
    }
    
    // Fetch immediately and then every 5 seconds
    fetchDashboardStats();
    setInterval(fetchDashboardStats, 5000);

    // ----------------------------------------------------
    // Feature 2: Energy Forecast Chart
    // ----------------------------------------------------
    const ctx = document.getElementById('forecastChart');
    if (ctx) {
        let gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        const chartData = {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Predicted Usage (kWh)',
                data: [300, 250, 800, 1200, 1100, 700, 350],
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };

        const forecastChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false, drawBorder: false },
                        ticks: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#4b5563' }
                    },
                    y: { 
                        grid: { color: 'rgba(156, 163, 175, 0.1)', drawBorder: false },
                        ticks: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#4b5563' }
                    }
                }
            }
        });

        // Update chart colors on theme change
        themeToggleBtn.addEventListener('click', () => {
            setTimeout(() => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const tickColor = isDark ? '#9ca3af' : '#4b5563';
                forecastChart.options.scales.x.ticks.color = tickColor;
                forecastChart.options.scales.y.ticks.color = tickColor;
                forecastChart.update();
            }, 50);
        });

        // Fetch realistic dataset change for dashboard widget
        document.getElementById('building-select').addEventListener('change', async (e) => {
            const val = e.target.value;
            try {
                const response = await fetch(`http://localhost:8000/api/forecast?building=${val}`);
                const data = await response.json();
                forecastChart.data.datasets[0].data = data.datasets[0];
                forecastChart.update();
            } catch(error) {
                console.error("Forecast fetch error", error);
            }
        });

        // Setup Initial Data for Chart
        async function fetchForecastData() {
             try {
                 const response = await fetch('http://localhost:8000/api/forecast');
                 const data = await response.json();
                 forecastChart.data.labels = data.labels;
                 forecastChart.data.datasets[0].data = data.datasets[0];
                 forecastChart.update();
             } catch(error) {
                 console.error("Forecast fetch error", error);
             }
        }
        fetchForecastData();
    }

    // ----------------------------------------------------
    // Detailed Energy Forecast Chart (View 2)
    // ----------------------------------------------------
    const detailedCtx = document.getElementById('detailedForecastChart');
    if (detailedCtx) {
        let gradThis = detailedCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradThis.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradThis.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        
        let gradLast = detailedCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradLast.addColorStop(0, 'rgba(156, 163, 175, 0.2)');
        gradLast.addColorStop(1, 'rgba(156, 163, 175, 0.0)');

        // Initial Empty Chart
        detailedChart = new Chart(detailedCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Predicted',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: gradThis,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Actual',
                        data: [],
                        borderColor: '#9ca3af',
                        backgroundColor: gradLast,
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#cbd5e1' : '#4b5563' }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#4b5563' }
                    },
                    y: {
                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                        ticks: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#4b5563' }
                    }
                }
            }
        });

        async function fetchDetailedForecast(type = 'this_week') {
            try {
                const response = await fetch(`http://localhost:8000/api/detailed_forecast?type=${type}`);
                const data = await response.json();
                
                detailedChart.data.labels = data.labels;
                
                // Update dataset 1 (Predicted / This Period)
                detailedChart.data.datasets[0].label = data.datasets[0].label;
                detailedChart.data.datasets[0].data = data.datasets[0].data;
                
                // Update dataset 2 (Actual / Last Period)
                detailedChart.data.datasets[1].label = data.datasets[1].label;
                detailedChart.data.datasets[1].data = data.datasets[1].data;
                
                detailedChart.update();
            } catch(error) {
                console.error("Detailed Forecast fetch error", error);
            }
        }
        
        // Initial Fetch
        fetchDetailedForecast();
        
        // Setup dropdown listener
        const forecastTypeSelect = document.getElementById('forecast-type-select');
        if (forecastTypeSelect) {
            forecastTypeSelect.addEventListener('change', (e) => {
                fetchDetailedForecast(e.target.value);
            });
        }

        // Update colors on theme change
        themeToggleBtn.addEventListener('click', () => {
            setTimeout(() => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const tickColor = isDark ? '#9ca3af' : '#4b5563';
                const legendColor = isDark ? '#cbd5e1' : '#4b5563';
                
                detailedChart.options.scales.x.ticks.color = tickColor;
                detailedChart.options.scales.y.ticks.color = tickColor;
                detailedChart.options.plugins.legend.labels.color = legendColor;
                detailedChart.update();
            }, 50);
        });
    }

    // ----------------------------------------------------
    // Power Schedule Management (View 3) - Removed as per user request
    // ----------------------------------------------------

    // ----------------------------------------------------
    // Feature 4: Smart Room Monitor & Dynamic Room Rendering
    // ----------------------------------------------------
    let roomsData = [];
    
    async function fetchAndRenderRooms() {
        let data;
        try {
            const response = await fetch('http://localhost:8000/api/rooms');
            data = await response.json();
        } catch(e) {
            console.error('Failed to fetch rooms endpoint:', e);
            // Fallback mock data if API is down so smart rooms display correctly
            data = {
                buildings: ["Engineering", "Science Center", "Main Library"],
                rooms: [
                    { name: "Lab 101", building: "Science Center", occupied: false, acOn: false, lightsOn: true, energy: 1.2 },
                    { name: "Room 205", building: "Engineering", occupied: true, acOn: true, lightsOn: false, energy: 2.5 },
                    { name: "Conf Room A", building: "Main Library", occupied: true, acOn: true, lightsOn: true, energy: 3.1 },
                    { name: "Lecture Hall", building: "Science Center", occupied: false, acOn: false, lightsOn: false, energy: 0.0 },
                    { name: "Library 1F", building: "Main Library", occupied: true, acOn: true, lightsOn: true, energy: 4.5 },
                    { name: "Office 3B", building: "Engineering", occupied: false, acOn: false, lightsOn: false, energy: 0.1 }
                ]
            };
        }
        
        roomsData = data.rooms;
        
        // Populate Dropdowns for both Add Schedule and Room Monitor
        const addSchedSelect = document.getElementById('sched-room');
        const roomBuildingSelect = document.getElementById('room-building-select');
        
        if (addSchedSelect) {
            addSchedSelect.innerHTML = '<option value="" disabled selected>Choose a room...</option>';
            data.rooms.forEach(room => {
                const opt = document.createElement('option');
                opt.value = room.name;
                opt.innerText = room.name;
                addSchedSelect.appendChild(opt);
            });
        }
        
        if (roomBuildingSelect) {
            roomBuildingSelect.innerHTML = '<option value="all">All Buildings</option>';
            data.buildings.forEach(building => {
                const opt = document.createElement('option');
                opt.value = building;
                opt.innerText = building;
                roomBuildingSelect.appendChild(opt);
            });
        }
        
        renderRooms();
        
        // Init Smart Alerts based on newly fetched room data (only initial load)
        if(!allAlerts || allAlerts.length === 0) {
            initAlerts();
        }
    }

    const roomGrid = document.querySelector('.room-grid');
    const expandedRoomGrid = document.querySelector('.expanded-room-grid');
    const roomBuildingSelect = document.getElementById('room-building-select');
    const roomStatusSelect = document.getElementById('room-status-select');
    
    function renderRooms() {
        if (roomGrid) roomGrid.innerHTML = '';
        if (expandedRoomGrid) expandedRoomGrid.innerHTML = '';
        
        let filteredRooms = roomsData;
        const bSelect = roomBuildingSelect ? roomBuildingSelect.value : 'all';
        const sSelect = roomStatusSelect ? roomStatusSelect.value : 'all';
        
        if (bSelect !== 'all') {
             filteredRooms = filteredRooms.filter(r => r.building === bSelect);
        }
        
        if (sSelect === 'active') {
             filteredRooms = filteredRooms.filter(r => r.occupied || r.acOn || r.lightsOn);
        } else if (sSelect === 'idle') {
             filteredRooms = filteredRooms.filter(r => !r.occupied && !r.acOn && !r.lightsOn);
        }

        filteredRooms.forEach(room => {
            const acClass = room.acOn ? (room.occupied ? 'device-on efficient' : 'device-on wasteful') : 'device-off';
            const lightsClass = room.lightsOn ? (room.occupied ? 'device-on efficient' : 'device-on wasteful') : 'device-off';
            const occClass = room.occupied ? 'occupied' : 'empty';
            const occText = room.occupied ? 'Occupied' : 'Empty';

            // 1) Dashboard mini card
            if (roomGrid) {
                const miniCard = document.createElement('div');
                miniCard.className = 'room-card';
                miniCard.innerHTML = `
                    <div class="room-header">
                        <span>${room.name}</span>
                        <span class="occupancy-badge ${occClass}" style="background: ${room.occupied? 'rgba(16,185,129,0.1)':'rgba(255,255,255,0.05)'}; color: ${room.occupied? 'var(--success)':'var(--text-secondary)'}; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${occText}</span>
                    </div>
                    <div class="room-devices" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="material-symbols-rounded device-icon ${lightsClass}" style="color: ${room.lightsOn? 'var(--warning)':'var(--text-secondary)'}" title="Lights">lightbulb</span>
                        <span class="material-symbols-rounded device-icon ${acClass}" style="color: ${room.acOn? 'var(--primary)':'var(--text-secondary)'}" title="AC">mode_fan</span>
                    </div>
                    <div class="room-energy" style="margin-top: 0.5rem; font-weight: bold; font-size: 1.1rem; color: var(--text-primary);">
                        ${room.energy} kW
                    </div>
                `;
                roomGrid.appendChild(miniCard);
            }

            // 2) Room Monitor expanded card
            if (expandedRoomGrid) {
                const expCard = document.createElement('div');
                expCard.className = 'stat-card glass';
                expCard.style.display = 'flex';
                expCard.style.flexDirection = 'column';
                expCard.style.gap = '0.5rem';
                expCard.style.justifyContent = 'flex-start';
                expCard.style.alignItems = 'flex-start';
                expCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">${room.name}</h3>
                        <span class="status-dot ${room.occupied?'success':'warning'}" title="${occText}" style="width: 10px; height: 10px; border-radius: 50%; background: ${room.occupied?'var(--success)':'var(--warning)'}; display: inline-block;"></span>
                    </div>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${room.building}</p>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.9rem;">
                        <span style="display: flex; align-items: center; gap: 0.2rem;"><span class="material-symbols-rounded" style="font-size: 1.1rem; color: ${room.acOn? 'var(--primary)':'var(--text-secondary)'};">mode_fan</span> ${room.acOn ? 'ON' : 'OFF'}</span>
                        <span style="display: flex; align-items: center; gap: 0.2rem;"><span class="material-symbols-rounded" style="font-size: 1.1rem; color: ${room.lightsOn? 'var(--warning)':'var(--text-secondary)'};">lightbulb</span> ${room.lightsOn ? 'ON' : 'OFF'}</span>
                    </div>
                    <div style="margin-top: auto; padding-top: 1rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid rgba(255,255,255,0.05);">
                        <span>Current Draw:</span>
                        <strong>${room.energy} kW</strong>
                    </div>
                `;
                expandedRoomGrid.appendChild(expCard);
            }
        });
    }

    if(roomBuildingSelect) roomBuildingSelect.addEventListener('change', renderRooms);
    if(roomStatusSelect) roomStatusSelect.addEventListener('change', renderRooms);
    // ----------------------------------------------------
    // Feature 5: Manual Override
    // ----------------------------------------------------
    const overrideInputs = document.querySelectorAll('.override-controls input[type="checkbox"]');
    const impactMsg = document.getElementById('override-impact');
    const impactText = document.getElementById('impact-text');

    overrideInputs.forEach(input => {
        input.addEventListener('change', () => {
            const isOff = !input.checked;
            if (isOff) {
                impactText.innerText = `Power down command sent. Est. saving: 0.5 kWh/hr.`;
                impactMsg.style.background = 'rgba(16, 185, 129, 0.1)';
                impactMsg.style.color = 'var(--success)';
            } else {
                impactText.innerText = `Device activated. Modifying energy baseline.`;
                impactMsg.style.background = 'rgba(59, 130, 246, 0.1)';
                impactMsg.style.color = 'var(--primary)';
            }
            impactMsg.classList.remove('hidden');
            
            // hide after 3s
            clearTimeout(impactMsg.timeout);
            impactMsg.timeout = setTimeout(() => {
                impactMsg.classList.add('hidden');
            }, 3000);
        });
    });

    // ----------------------------------------------------
    // Feature 7: Carbon Calculator
    // ----------------------------------------------------
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const lights = parseFloat(document.getElementById('calc-lights').value) || 0;
            const ac = parseFloat(document.getElementById('calc-ac').value) || 0;
            
            // Fake formula: lights ~ 0.2 kWh/hr, ac ~ 2.0 kWh/hr
            const energySaved = (lights * 0.2) + (ac * 2.0);
            const co2Red = energySaved * 0.4; // 0.4 kg CO2 per kWh
            const trees = Math.floor(co2Red / 2); // 1 tree offsets ~2kg per month (simplified)

            document.getElementById('res-energy').innerText = energySaved.toFixed(1) + ' kWh';
            document.getElementById('res-co2').innerText = co2Red.toFixed(1) + ' kg';
            document.getElementById('res-trees').innerText = trees;
            
            document.getElementById('calc-result').classList.remove('hidden');
        });
    }

    // ----------------------------------------------------
    // Feature 8: Smart Alerts Queue & Resolve System
    // ----------------------------------------------------
    // Feature 8: Smart Alerts Queue & Resolve System
    // ----------------------------------------------------
    let allAlerts = [];
    let alertIdCounter = 1;

    function generateAlertsFromRooms() {
        if (!roomsData || roomsData.length === 0) return [];
        let newAlerts = [];
        
        roomsData.forEach(room => {
            // Case 1: Room Empty, Equipment ON
            if (!room.occupied && (room.acOn || room.lightsOn)) {
                let errStr = [];
                if(room.acOn) errStr.push('AC');
                if(room.lightsOn) errStr.push('Lights');
                
                newAlerts.push({
                    id: alertIdCounter++, 
                    type: 'warning', 
                    icon: 'warning', 
                    title: `${room.name} ${errStr.join(' & ')} ON but empty`, 
                    time: 'Detected just now',
                    roomRef: room.name // Used to verify if still an issue later
                });
            }
            
            // Case 2: High Energy Draw
            if (room.energy > 3.0) {
                 newAlerts.push({
                    id: alertIdCounter++, 
                    type: 'danger', 
                    icon: 'error', 
                    title: `${room.name} High energy draw (${room.energy}kW)`, 
                    time: 'Detected 5 mins ago',
                    roomRef: room.name
                });
            }

            // Case 3: Good state
            if (room.occupied && !room.acOn && !room.lightsOn) {
                 newAlerts.push({
                    id: alertIdCounter++, 
                    type: 'info', 
                    icon: 'info', 
                    title: `${room.name} Natural lighting utilization`, 
                    time: 'System monitored',
                    resolved: true,
                    roomRef: room.name
                });
            }
        });

        // Add some random generic ones if queue is too small to fulfill the 15 user requested queue
        const genericAlerts = [
            { type: 'info', icon: 'info', title: 'Main server room cooling optimized', time: 'System auto-adjusted', resolved: true },
            { type: 'warning', icon: 'warning', title: 'Library HVAC inefficiency detected', time: 'Detected 30 mins ago' },
            { type: 'danger', icon: 'error', title: 'Lecture Hall A power spike', time: 'Detected 5 mins ago' },
            { type: 'warning', icon: 'warning', title: 'Cafeteria lights left on', time: 'Detected 2 hrs ago' },
            { type: 'info', icon: 'info', title: 'Solar panel output peak', time: 'System auto-adjusted' }
        ];

        while(newAlerts.length < 15) {
             const randomGeneric = genericAlerts[Math.floor(Math.random() * genericAlerts.length)];
             newAlerts.push({
                id: alertIdCounter++,
                type: randomGeneric.type,
                icon: randomGeneric.icon,
                title: randomGeneric.title,
                time: randomGeneric.time,
                resolved: randomGeneric.resolved
             });
        }
        
        return newAlerts;
    }

    let currentAlertIndex = 3; // Start from index 3 since first 3 are rendered initially
    const alertsContainer = document.querySelector('.alerts-container');
    const successModal = document.getElementById('success-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    let currentlyResolvingCard = null;

    let currentAlertToResolveObj = null;

    function renderAlertCard(alertObj) {
        const div = document.createElement('div');
        div.className = `alert-card ${alertObj.type}`;
        div.style.animation = 'fadeIn 0.5s';
        
        let btnHtml = alertObj.resolved 
            ? `<button class="glass-btn resolve-btn" disabled>Resolved</button>`
            : `<button class="glass-btn resolve-btn">Resolve</button>`;

        div.innerHTML = `
            <span class="material-symbols-rounded alert-icon">${alertObj.icon}</span>
            <div class="alert-content">
                <h4>${alertObj.title}</h4>
                <p>${alertObj.time}</p>
            </div>
            ${btnHtml}
        `;

        // Attach event listener to new resolve button
        const btn = div.querySelector('.resolve-btn');
        if (btn && !alertObj.resolved) {
            btn.addEventListener('click', (e) => handleResolveClick(e, alertObj));
        }

        return div;
    }

    function initAlerts() {
        if (!alertsContainer) return;
        
        // Generate the queue of alerts from actual room data + generics
        allAlerts = generateAlertsFromRooms();
        currentAlertIndex = 3;

        alertsContainer.innerHTML = '';
        for (let i = 0; i < 3 && i < allAlerts.length; i++) {
            alertsContainer.appendChild(renderAlertCard(allAlerts[i]));
        }
    }

    function handleResolveClick(e, alertObj) {
        const btn = e.target;
        if (btn.disabled) return;
        
        btn.innerText = 'Resolved';
        btn.disabled = true;
        btn.style.background = 'var(--success)';
        btn.style.color = 'white';
        
        currentAlertToResolveObj = alertObj;
        currentlyResolvingCard = btn.closest('.alert-card');
        if (currentlyResolvingCard) {
            currentlyResolvingCard.style.opacity = '0.7';
            currentlyResolvingCard.style.transform = 'scale(0.98)';
            currentlyResolvingCard.style.border = '1px solid var(--success)';
        }
        
        // Show modal
        if (successModal) {
            successModal.classList.add('active');
        }
        
        // Decrease notification badge
        const badge = document.querySelector('.notification-btn .badge');
        if (badge) {
            let cnt = parseInt(badge.innerText);
            if (cnt > 0) {
                badge.innerText = cnt - 1;
                if (cnt - 1 === 0) badge.style.display = 'none';
            }
        }
    }

    // Will now be explicitly called after `roomsData` is fetched first
    // initAlerts(); 

    // Close Modal and Spawn Next Alert
    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
            
            // Sync with Room Monitor if it was a room alert
            if (currentAlertToResolveObj && currentAlertToResolveObj.roomRef) {
                // Use a more relaxed matching logic in case of spaces in the mock strings vs generated strings
                const roomIndex = roomsData.findIndex(r => 
                    r.name.trim().toLowerCase() === currentAlertToResolveObj.roomRef.trim().toLowerCase()
                );
                
                if (roomIndex !== -1) {
                    // Force the room into an efficient state since we resolved the alert
                    roomsData[roomIndex].acOn = false;
                    roomsData[roomIndex].lightsOn = false;
                    roomsData[roomIndex].energy = "0.0";
                    roomsData[roomIndex].occupied = false; // Add occupied = false to be safe
                    
                    // Re-render the Room Monitor UI
                    renderRooms();
                } else {
                    console.log("Could not find room data to update for alert:", currentAlertToResolveObj.roomRef);
                }
            }
            
            if (currentlyResolvingCard && alertsContainer) {
                // Fade out the resolved card
                currentlyResolvingCard.style.transition = 'opacity 0.4s, height 0.4s, padding 0.4s, margin 0.4s';
                currentlyResolvingCard.style.opacity = '0';
                currentlyResolvingCard.style.height = '0px';
                currentlyResolvingCard.style.padding = '0';
                currentlyResolvingCard.style.margin = '0';
                currentlyResolvingCard.style.overflow = 'hidden';

                setTimeout(() => {
                    currentlyResolvingCard.remove();
                    currentlyResolvingCard = null;
                    currentAlertToResolveObj = null;

                    // Add the next alert from queue
                    if (currentAlertIndex < allAlerts.length) {
                        const newAlert = allAlerts[currentAlertIndex];
                        const newCard = renderAlertCard(newAlert);
                        alertsContainer.appendChild(newCard);
                        currentAlertIndex++;
                        
                        // Increase notification badge for newly arrived alert if not resolved
                        if(!newAlert.resolved) {
                             const badge = document.querySelector('.notification-btn .badge');
                             if (badge) {
                                 badge.style.display = 'flex';
                                 let cnt = parseInt(badge.innerText) || 0;
                                 badge.innerText = cnt + 1;
                             }
                        }
                    }
                }, 400); // Wait for fade out animation
            }
        });
    }

    // ----------------------------------------------------
    // Feature 9: Campus Map
    // ----------------------------------------------------
    const buildings = document.querySelectorAll('.building');
    const mapDetails = document.getElementById('map-details');
    
    buildings.forEach(b => {
        b.addEventListener('click', () => {
            document.getElementById('map-b-name').innerText = b.getAttribute('data-building');
            document.getElementById('map-b-usage').innerText = b.getAttribute('data-usage');
            
            const statusBox = document.getElementById('map-b-status');
            const status = b.getAttribute('data-status');
            statusBox.innerText = status;
            
            if (status === 'Optimal') statusBox.style.color = 'var(--success)';
            else if (status === 'Moderate') statusBox.style.color = 'var(--warning)';
            else statusBox.style.color = 'var(--danger)';
            
            mapDetails.classList.remove('hidden');
        });
    });

    // ----------------------------------------------------
    // Feature 10: Tips Generator
    // ----------------------------------------------------
    const tips = [
        "Turn off AC when room is empty.",
        "Use natural light during the day to save energy.",
        "Schedule automatic shutdown for lab computers at night.",
        "Maintain 24°C cooling for optimal energy efficiency.",
        "Replace aging projector lamps with LED equivalents.",
        "Encourage taking stairs instead of elevators for 1-2 floors."
    ];

    const generateTipBtn = document.getElementById('generate-tip-btn');
    if (generateTipBtn) {
        generateTipBtn.addEventListener('click', () => {
            const tipText = document.getElementById('tip-text');
            // Fade out
            tipText.style.opacity = 0;
            setTimeout(() => {
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                tipText.innerText = `"${randomTip}"`;
                // Fade in
                tipText.style.opacity = 1;
            }, 200);
        });
    }

    // ----------------------------------------------------
    // Feature 11: Backend Integration
    // ----------------------------------------------------
    async function fetchOptimizationData() {
        let data;
        try {
            const response = await fetch('http://localhost:8000/api/optimization');
            data = await response.json();
            
        } catch (error) {
            console.error('Error fetching optimization data:', error);
            // Fallback mock data if API is down
            data = [
                { room: "Lab 101", current_status: "Active", predicted_empty: "18:00", power_down_time: "18:15", est_saved: "2.5 kWh", action: "Power Down All" },
                { room: "Room 205", current_status: "Idle", predicted_empty: "14:30", power_down_time: "14:45", est_saved: "1.2 kWh", action: "HVAC Off" },
                { room: "Conf Room A", current_status: "Active", predicted_empty: "16:00", power_down_time: "16:15", est_saved: "3.0 kWh", action: "Power Down All" },
                { room: "Lecture Hall", current_status: "Empty", predicted_empty: "Already Empty", power_down_time: "Immediate", est_saved: "4.5 kWh", action: "Lights Off" },
                { room: "Library 1F", current_status: "Active", predicted_empty: "22:00", power_down_time: "22:30", est_saved: "5.0 kWh", action: "Power Down All" }
            ];
        }

        // Populate Dashboard Schedule
        const scheduleTbody = document.getElementById('schedule-tbody');
        if (scheduleTbody) {
            scheduleTbody.innerHTML = '';
            data.slice(0, 5).forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.room}</strong></td>
                    <td>${item.current_status}</td>
                    <td>${item.predicted_empty}</td>
                    <td>${item.power_down_time}</td>
                    <td style="color: var(--success);">${item.est_saved}</td>
                `;
                scheduleTbody.appendChild(tr);
            });
        }

        // Populate Detailed Schedule (if applicable)
        let apiSchedules = data.map((item, index) => ({
            id: 'api_' + index,
            room: item.room,
            action: item.action || 'Power Down',
            time: item.power_down_time,
            status: item.current_status === 'Idle' || item.current_status === 'Empty' ? 'Active' : 'Scheduled'
        }));
        
        detailedSchedules = [...apiSchedules, ...addedSchedules];
        if (typeof renderDetailedSchedules === 'function') {
            renderDetailedSchedules();
        }
    }

    async function fetchDetailedForecastDate(type) {
        let data;
        try {
            const response = await fetch(`http://localhost:8000/api/detailed_forecast?type=${type}`);
            data = await response.json();
        } catch(error) {
            console.error("Detailed Forecast fetch error", error);
            // Fallback mock data if API is down
            if (type === 'this_week') {
                data = {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        { label: 'This Week (Predicted)', data: [4200, 4500, 4300, 4800, 4100, 1200, 900] },
                        { label: 'Last Week (Actual)', data: [4100, 4600, 4200, 4700, 4300, 1500, 1100] }
                    ]
                };
            } else if (type === 'this_month') {
                data = {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        { label: 'This Month (Predicted)', data: [18000, 19500, 19000, 18500] },
                        { label: 'Last Month (Actual)', data: [18500, 19000, 19500, 19200] }
                    ]
                };
            } else if (type === 'this_year') {
                data = {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        { label: 'This Year (Predicted)', data: [75000, 72000, 68000, 65000, 70000, 85000, 92000, 90000, 80000, 70000, 68000, 73000] },
                        { label: 'Last Year (Actual)', data: [76000, 73000, 70000, 66000, 68000, 82000, 89000, 88000, 78000, 69000, 67000, 74000] }
                    ]
                };
            }
        }
        
        if(typeof detailedChart !== 'undefined' && data) {
            detailedChart.data.labels = data.labels;
            detailedChart.data.datasets[0].label = data.datasets[0].label;
            detailedChart.data.datasets[0].data = data.datasets[0].data;
            detailedChart.data.datasets[1].label = data.datasets[1].label;
            detailedChart.data.datasets[1].data = data.datasets[1].data;
            detailedChart.update();
        }
    }

    const detailedSelect = document.getElementById('detailed-forecast-select');
    if(detailedSelect) {
        detailedSelect.addEventListener('change', (e) => {
            fetchDetailedForecastDate(e.target.value);
        });
    }

    async function fetchForecastDataOnce() {
        // Handled in initialization block for main forecast
        // We'll also initialize the detailed forecast here
        fetchDetailedForecastDate('this_week');
    }

    async function fetchLeaderboard() {
        try {
            const response = await fetch('http://localhost:8000/api/leaderboard');
            const data = await response.json();
            
            const lbTable = document.querySelector('.leaderboard-table tbody');
            if(lbTable) {
                lbTable.innerHTML = '';
                data.forEach(item => {
                    let rankClass = item.rank === 1 ? 'gold' : item.rank === 2 ? 'silver' : item.rank === 3 ? 'bronze' : '';
                    let points = item.points ? `<td><span class="material-symbols-rounded" style="font-size: 1rem; color: #f59e0b; vertical-align: middle;">toll</span> ${item.points.toLocaleString()}</td>` : '';
                    let bgStyle = item.rank > 3 ? 'background: rgba(255,255,255,0.1);' : '';
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><div class="rank ${rankClass}" style="${bgStyle}">${item.rank}</div></td>
                        <td><strong>${item.dept}</strong></td>
                        <td><span style="color: var(--success);">+${item.saved.toLocaleString()} kWh</span></td>
                        ${points}
                    `;
                    lbTable.appendChild(tr);
                });
            }
        } catch(err) {
            console.error(err);
        }
    }

    async function fetchCarbonImpact() {
        try {
            const response = await fetch('http://localhost:8000/api/carbon_impact');
            const data = await response.json();
            
            const tonsVal = document.getElementById('carbon-tons-val');
            const vsLastYear = document.getElementById('carbon-vs-last-year');
            const treesPlanted = document.getElementById('trees-planted-val');
            const carsOff = document.getElementById('cars-off-val');
            const homesPowered = document.getElementById('homes-powered-val');
            
            if(tonsVal) tonsVal.innerText = data.tons_co2;
            if(vsLastYear) vsLastYear.innerText = `${data.vs_last_year}% vs last year`;
            if(treesPlanted) treesPlanted.innerText = data.trees_planted;
            if(carsOff) carsOff.innerText = data.cars_removed;
            if(homesPowered) homesPowered.innerText = data.homes_powered;
            
        } catch(e) {
            console.error('Failed to fetch carbon impact:', e);
        }
    }

    async function fetchStatusData() {
        try {
            const response = await fetch('http://localhost:8000/api/status');
            const data = await response.json();
            
            // Update Top usage
            const usageSpan = document.querySelector('.current-usage span:nth-child(2)');
            if(usageSpan) {
                usageSpan.innerHTML = `Current Usage: <strong>${data.current_mw} MW</strong>`;
            }

            // Update Counters targets dynamically
            const statCards = document.querySelectorAll('.stat-card .counter');
            if (statCards.length >= 5) {
                statCards[0].innerText = Math.floor(data.total_usage).toLocaleString();
                statCards[1].innerText = Math.floor(data.energy_saved).toLocaleString();
                statCards[2].innerText = Math.floor(data.carbon_reduction).toLocaleString();
                statCards[3].innerText = data.active_rooms;
                statCards[4].innerText = data.idle_rooms;
            }

        } catch (error) {
            console.error('Error fetching status data:', error);
        }
    }

    // Call data fetchers
    fetchOptimizationData();
    fetchStatusData();
    fetchLeaderboard();
    fetchAndRenderRooms();
    fetchCarbonImpact();
    
    // Setup interval for live dashboard status update
    setInterval(fetchStatusData, 10000); // 10 seconds

    // Custom Optimization Simulation: Increase Total Usage every 5 sec and calculate Carbon/Energy savings
    setInterval(() => {
        const statCards = document.querySelectorAll('.stat-card .counter');
        if (statCards.length >= 3) {
            let totalUsage = parseInt(statCards[0].innerText.replace(/,/g, '')) || 0;
            let energySaved = parseInt(statCards[1].innerText.replace(/,/g, '')) || 0;
            let carbonReduction = parseInt(statCards[2].innerText.replace(/,/g, '')) || 0;

            // Scenario: 1 unit increase every 5 seconds normally
            totalUsage += 1;
            
            // Optimization logic algorithm
            const optimizationActive = Math.random() > 0.4; // 60% chance to trigger efficiency algorithm
            if (optimizationActive) {
                energySaved += 1;
                carbonReduction += 1;
            }

            statCards[0].innerText = totalUsage.toLocaleString();
            statCards[1].innerText = energySaved.toLocaleString();
            statCards[2].innerText = carbonReduction.toLocaleString();
        }
    }, 5000);

    // Apply Schedule Logic
    const applyScheduleBtn = document.getElementById('apply-schedule-btn');
    if(applyScheduleBtn) {
        applyScheduleBtn.addEventListener('click', () => {
             // Create temporary notification banner inside the section
             const section = document.getElementById('power-schedule');
             const banner = document.createElement('div');
             banner.className = 'alert-card success mt-1';
             banner.style.width = '100%';
             banner.style.justifyContent = 'center';
             banner.innerHTML = `
                <span class="material-symbols-rounded alert-icon">check_circle</span>
                <div class="alert-content"><h4>Schedule Applied Successfully</h4></div>
             `;
             
             // Update the table dynamically to simulate action taking effect
             const tbody = document.getElementById('schedule-tbody');
             if(tbody && tbody.children.length > 0) {
                 tbody.children[0].children[1].innerText = "Powering Down...";
                 tbody.children[0].children[1].style.color = "var(--warning)";
             }
             
             section.insertBefore(banner, document.querySelector('.table-responsive'));
             
             // Change button color to feedback state
             const prevHtml = applyScheduleBtn.innerHTML;
             applyScheduleBtn.innerHTML = "Processing...";
             applyScheduleBtn.disabled = true;

             setTimeout(() => {
                 applyScheduleBtn.innerHTML = prevHtml;
                 applyScheduleBtn.disabled = false;
                 banner.remove();
                 if(tbody && tbody.children.length > 0) {
                    tbody.children[0].children[1].innerText = "Idle";
                    tbody.children[0].children[1].style.color = "var(--text-secondary)";
                 }
             }, 3000);
        });
    }

});
