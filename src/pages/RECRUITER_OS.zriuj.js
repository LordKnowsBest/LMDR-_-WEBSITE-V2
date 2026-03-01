// BARE MINIMUM TEST — does the bridge connect at all?

$w.onReady(function () {
  console.log('[ROS-TEST] $w.onReady fired!');

  const ids = ['#html8', '#html1', '#html2', '#html3', '#html4', '#html5', '#html6'];

  ids.forEach(function(id) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === 'function') {
        console.log('[ROS-TEST] Found HTML component:', id);

        el.onMessage(function(event) {
          const msg = event.data;
          console.log('[ROS-TEST] Received message:', msg);

          if (msg && msg.type) {
            el.postMessage({ type: 'pong', data: { echo: msg.type } });
          }
        });

        // Proactive ping after 500ms
        setTimeout(function() {
          el.postMessage({ type: 'recruiterReady', data: { test: true } });
          console.log('[ROS-TEST] Sent recruiterReady to', id);
        }, 500);
      }
    } catch (e) {
      console.log('[ROS-TEST] Error with', id, ':', e.message);
    }
  });

  console.log('[ROS-TEST] Init complete');
});
