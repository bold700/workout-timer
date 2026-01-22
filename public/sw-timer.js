// Custom service worker voor timer notifications
// Dit wordt geregistreerd naast de VitePWA service worker

let timerNotification = null;
let timerUpdateInterval = null;
let currentState = null;

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((milliseconds % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
}

function getNotificationTitle(state) {
  switch (state.mode) {
    case 'stopwatch':
      return '⏱️ Stopwatch';
    case 'countdown':
      return '⏰ Countdown';
    case 'interval':
      const phaseText = state.phase === 'work' ? 'Work' : 'Rest';
      return `🔄 Interval - ${phaseText} (${state.round}/${state.totalRounds})`;
    default:
      return 'Timer';
  }
}

function getNotificationBody(state) {
  return formatTime(state.time);
}

async function showTimerNotification(state) {
  const title = getNotificationTitle(state);
  const body = getNotificationBody(state);
  const tag = 'workout-timer';

  // Gebruik base path voor icons
  const basePath = self.location.pathname.replace(/\/sw-timer\.js$/, '') || '/workout-timer';
  
  const options = {
    tag: tag,
    body: body,
    icon: `${basePath}/timer-icon.svg`,
    badge: `${basePath}/timer-icon.svg`,
    requireInteraction: false,
    silent: true,
    renotify: true,
    data: {
      timerState: state,
      timestamp: Date.now(),
    },
  };

  // Sluit bestaande notification en maak nieuwe
  if (timerNotification) {
    timerNotification.close();
  }

  timerNotification = await self.registration.showNotification(title, options);
}

async function updateTimerNotification(state) {
  if (!timerNotification) {
    await showTimerNotification(state);
    return;
  }

  const title = getNotificationTitle(state);
  const body = getNotificationBody(state);

  // Gebruik base path voor icons
  const basePath = self.location.pathname.replace(/\/sw-timer\.js$/, '') || '/workout-timer';
  
  // Update de notification
  await self.registration.showNotification(title, {
    tag: timerNotification.tag,
    body: body,
    icon: `${basePath}/timer-icon.svg`,
    badge: `${basePath}/timer-icon.svg`,
    requireInteraction: false,
    silent: true,
    renotify: true,
    data: {
      timerState: state,
      timestamp: Date.now(),
    },
  });
}

function startTimerUpdates(state) {
  // Stop bestaande interval
  if (timerUpdateInterval) {
    clearInterval(timerUpdateInterval);
  }

  currentState = state;
  
  // Start nieuwe interval voor updates
  let currentTime = state.time;
  const isCountdown = state.mode === 'countdown' || state.mode === 'interval';
  
  timerUpdateInterval = setInterval(() => {
    if (currentState && currentState.isRunning) {
      if (isCountdown) {
        currentTime = Math.max(0, currentTime - 1000);
      } else {
        currentTime += 1000;
      }

      updateTimerNotification({
        ...currentState,
        time: currentTime,
      });
    } else {
      stopTimerUpdates();
    }
  }, 1000);
}

function stopTimerUpdates() {
  if (timerUpdateInterval) {
    clearInterval(timerUpdateInterval);
    timerUpdateInterval = null;
  }

  if (timerNotification) {
    timerNotification.close();
    timerNotification = null;
  }
  
  currentState = null;
}

// Luister naar berichten van de main thread
self.addEventListener('message', (event) => {
  const { type, state } = event.data;

  switch (type) {
    case 'START_TIMER_NOTIFICATION':
      showTimerNotification(state);
      startTimerUpdates(state);
      break;

    case 'UPDATE_TIMER_NOTIFICATION':
      currentState = state;
      updateTimerNotification(state);
      // Herstart updates met nieuwe state als timer nog loopt
      if (state.isRunning && !timerUpdateInterval) {
        startTimerUpdates(state);
      }
      break;

    case 'STOP_TIMER_NOTIFICATION':
      stopTimerUpdates();
      break;
  }
});

// Luister naar notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open de app wanneer op notification wordt geklikt
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Als er al een window open is, focus daarop
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      // Anders open een nieuw window
      if (clients.openWindow) {
        const basePath = self.location.pathname.replace(/\/sw-timer\.js$/, '') || '/workout-timer';
        return clients.openWindow(basePath);
      }
    })
  );
});
