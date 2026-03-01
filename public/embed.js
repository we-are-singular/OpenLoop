(function() {
  if(!window.OpenLoop){
    window.OpenLoop = {}
  }
  var config = window.OpenLoop || {};
  var org = config.org || new URLSearchParams(window.location.search).get('org') || 'demo';
  var userId = config.userId || '';
  var accentColor = config.accentColor || '#6366f1';
  var anchor = config.anchor || config.position || 'right'; // 'left' or 'right'
  var showFloatingButton = config.showFloatingButton !== false; // default true

  // SVG icon strings for the floating button
  var iconChat = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var iconClose = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  // Sanitize accentColor to prevent CSS injection
  // Only allow valid hex colors (3 or 6 hex digits)
  var colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!colorRegex.test(accentColor)) {
    accentColor = '#6366f1'; // Default to indigo if invalid
  }

  // Create container - always create container, but button visibility depends on config
  var container = document.createElement('div');
  container.id = 'openloop-container';

  // If floating button is disabled, still show the widget inline (at bottom of page)
  // Otherwise position as fixed floating widget
  if (showFloatingButton) {
    container.style.cssText = 'position:fixed;z-index:999999;' + (anchor === 'left' ? 'left:20px;bottom:20px;' : 'right:20px;bottom:20px;');
  } else {
    // No floating button - widget can still be opened via window.OpenLoop.open()
    container.style.cssText = 'position:fixed;z-index:999999;left:20px;bottom:20px;';
  }

  // Create toggle button - only show if floating button is enabled
  var button = null;
  if (showFloatingButton) {
    button = document.createElement('button');
    button.innerHTML = iconChat;
    button.style.lineHeight = '0';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Open feedback widget');
    // Use inline style with !important to override host page styles
    button.style.cssText = 'width:56px !important;height:56px !important;border-radius:50% !important;border:none !important;background:' + accentColor + ' !important;color:white !important;font-size:24px !important;cursor:pointer !important;box-shadow:0 4px 12px rgba(0,0,0,0.15) !important;transition:transform 0.2s !important;display:flex !important;align-items:center !important;justify-content:center !important;';
    button.onmouseover = function() { button.style.transform = 'scale(1.1)'; };
    button.onmouseout = function() { button.style.transform = 'scale(1)'; };
  }

  // Create iframe
  var iframe = document.createElement('iframe');
  var iframeUrl = '/widget?org=' + encodeURIComponent(org);
  if (userId) {
    iframeUrl += '&userId=' + encodeURIComponent(userId);
  }
  if (accentColor) {
    iframeUrl += '&accentColor=' + encodeURIComponent(accentColor);
  }
  if (anchor) {
    iframeUrl += '&anchor=' + encodeURIComponent(anchor);
  }
  iframe.src = iframeUrl;
  iframe.style.cssText = 'position:absolute;' + (anchor === 'left' ? 'left:0;' : 'right:0;') + 'bottom:70px;width:320px;height:500px;border:none;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);display:none;background:white;';
  iframe.title = 'OpenLoop Widget';

  // Toggle functionality - only attach if button exists
  var isOpen = false;
  if (button) {
    button.onclick = function() {
      isOpen = !isOpen;
      iframe.style.display = isOpen ? 'block' : 'none';
      button.innerHTML = isOpen ? iconClose : iconChat;
    };
  }

  // Store pending data to send when iframe loads
  var pendingOpenData = null;

  // Expose API for programmatic control
  window.OpenLoop.open = function(data) {
    isOpen = true;
    iframe.style.display = 'block';
    if (button) {
      button.innerHTML = iconClose;
    }

    // If data is provided, send it to the iframe
    if (data) {
      pendingOpenData = data;
      // If iframe is already loaded, send immediately
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'OPENLOOP_OPEN',
          data: data
        }, '*');
      }
    }
  };

  window.OpenLoop.close = function() {
    isOpen = false;
    iframe.style.display = 'none';
    if (button) {
      button.innerHTML = iconChat;
    }
  };

  window.OpenLoop.toggle = function(data) {
    if (isOpen) {
      window.OpenLoop.close();
    } else {
      window.OpenLoop.open(data);
    }
  };

  // Listen for iframe load to send pending data
  iframe.onload = function() {
    if (pendingOpenData && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'OPENLOOP_OPEN',
        data: pendingOpenData
      }, '*');
      pendingOpenData = null;
    }
  };

  container.appendChild(iframe);
  if (button) {
    container.appendChild(button);
  }
  document.body.appendChild(container);
})();
