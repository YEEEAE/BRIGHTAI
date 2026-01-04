/**
 * BrightAI Advanced Analytics Module
 * Comprehensive analytics tracking including heatmaps, form tracking, video engagement, and enhanced scroll depth
 * Version: 1.0.0
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */
'use strict';

/**
 * Advanced Analytics Module
 * Extends BrightAIAnalytics with heatmap, form, and video tracking
 */
const BrightAIAdvancedAnalytics = (function() {
    // Configuration
    const config = {
        // Heatmap provider configuration (Microsoft Clarity - free and RTL-friendly)
        heatmap: {
            provider: 'clarity',
            siteId: '', // Set via init() or environment
            enabled: true
        },
        // Form tracking configuration
        formTracking: {
            enabled: true,
            trackFocus: true,
            trackBlur: true,
            trackChange: true,
            trackSubmit: true,
            trackAbandonment: true,
            abandonmentTimeout: 30000 // 30 seconds of inactivity
        },
        // Video tracking configuration
        videoTracking: {
            enabled: true,
            progressMilestones: [25, 50, 75, 100],
            trackPlay: true,
            trackPause: true,
            trackEnded: true
        },
        // Enhanced scroll depth configuration
        scrollDepth: {
            enabled: true,
            thresholds: [25, 50, 75, 100]
        },
        debugMode: false
    };

    // State tracking
    const state = {
        isInitialized: false,
        heatmapLoaded: false,
        formStates: new Map(), // Track form interaction states
        videoStates: new Map(), // Track video progress states
        scrollDepthReached: new Set(),
        lastActivityTime: Date.now()
    };

    /**
     * Initialize dataLayer if not already present
     */
    function initDataLayer() {
        window.dataLayer = window.dataLayer || [];
    }

    /**
     * Push event to dataLayer for GTM integration
     * @param {Object} eventData - Event data to push
     */
    function pushToDataLayer(eventData) {
        initDataLayer();
        const enrichedEvent = {
            ...eventData,
            timestamp: new Date().toISOString(),
            page_path: window.location.pathname,
            page_title: document.title,
            page_language: document.documentElement.lang || 'ar',
            page_direction: document.documentElement.dir || 'rtl'
        };
        window.dataLayer.push(enrichedEvent);
        
        if (config.debugMode) {
            console.log('[BrightAI Advanced Analytics] Event pushed:', enrichedEvent);
        }
    }


    /**
     * =================================================================================
     * HEATMAP TRACKING (Requirements 21.1)
     * Integrates Microsoft Clarity for heatmap and session recording
     * Configured for Arabic RTL pages
     * =================================================================================
     */
    
    /**
     * Initialize Microsoft Clarity heatmap tracking
     * @param {string} siteId - Clarity project ID
     */
    function initHeatmapTracking(siteId) {
        if (!config.heatmap.enabled) {
            if (config.debugMode) {
                console.log('[BrightAI Advanced Analytics] Heatmap tracking disabled');
            }
            return;
        }

        const clarityId = siteId || config.heatmap.siteId;
        
        if (!clarityId) {
            console.warn('[BrightAI Advanced Analytics] Clarity site ID not provided. Heatmap tracking skipped.');
            return;
        }

        // Check if Clarity is already loaded
        if (window.clarity) {
            state.heatmapLoaded = true;
            if (config.debugMode) {
                console.log('[BrightAI Advanced Analytics] Clarity already loaded');
            }
            return;
        }

        // Microsoft Clarity initialization script
        (function(c, l, a, r, i, t, y) {
            c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r);
            t.async = 1;
            t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0];
            y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", clarityId);

        // Configure Clarity for RTL Arabic pages
        window.clarity = window.clarity || function() {
            (window.clarity.q = window.clarity.q || []).push(arguments);
        };

        // Set custom tags for Arabic RTL context
        window.clarity("set", "page_language", "ar");
        window.clarity("set", "page_direction", "rtl");
        window.clarity("set", "site_region", "SA");

        state.heatmapLoaded = true;

        pushToDataLayer({
            event: 'heatmap_initialized',
            heatmap_provider: 'clarity',
            heatmap_site_id: clarityId
        });

        if (config.debugMode) {
            console.log('[BrightAI Advanced Analytics] Microsoft Clarity initialized:', clarityId);
        }
    }

    /**
     * Set custom Clarity tag
     * @param {string} key - Tag key
     * @param {string} value - Tag value
     */
    function setClarityTag(key, value) {
        if (window.clarity && state.heatmapLoaded) {
            window.clarity("set", key, value);
        }
    }

    /**
     * Identify user in Clarity
     * @param {string} userId - User identifier
     * @param {string} sessionId - Session identifier
     * @param {string} pageName - Current page name
     */
    function identifyClarityUser(userId, sessionId, pageName) {
        if (window.clarity && state.heatmapLoaded) {
            window.clarity("identify", userId, sessionId, pageName);
        }
    }


    /**
     * =================================================================================
     * FORM INTERACTION TRACKING (Requirements 21.2, 21.5)
     * Tracks focus, blur, change, submit events and form abandonment
     * Pushes events to dataLayer for GTM integration
     * =================================================================================
     */

    /**
     * Initialize form tracking for all forms on the page
     */
    function initFormTracking() {
        if (!config.formTracking.enabled) {
            if (config.debugMode) {
                console.log('[BrightAI Advanced Analytics] Form tracking disabled');
            }
            return;
        }

        // Find all forms on the page
        const forms = document.querySelectorAll('form');
        
        forms.forEach((form, index) => {
            const formId = form.id || form.name || `form_${index}`;
            const formName = form.getAttribute('data-form-name') || form.name || formId;
            
            // Initialize form state
            state.formStates.set(formId, {
                formId: formId,
                formName: formName,
                startTime: null,
                lastInteractionTime: null,
                fieldsInteracted: new Set(),
                fieldsChanged: new Set(),
                submitted: false,
                abandoned: false
            });

            // Track form field interactions
            const fields = form.querySelectorAll('input, textarea, select');
            fields.forEach(field => {
                setupFieldTracking(field, formId, formName);
            });

            // Track form submission
            if (config.formTracking.trackSubmit) {
                form.addEventListener('submit', function(e) {
                    handleFormSubmit(formId, formName, form);
                });
            }
        });

        // Setup abandonment detection
        if (config.formTracking.trackAbandonment) {
            setupAbandonmentDetection();
        }

        if (config.debugMode) {
            console.log('[BrightAI Advanced Analytics] Form tracking initialized for', forms.length, 'forms');
        }
    }

    /**
     * Setup tracking for individual form field
     * @param {HTMLElement} field - Form field element
     * @param {string} formId - Parent form ID
     * @param {string} formName - Parent form name
     */
    function setupFieldTracking(field, formId, formName) {
        const fieldName = field.name || field.id || field.type;
        const fieldType = field.type || field.tagName.toLowerCase();

        // Track focus event
        if (config.formTracking.trackFocus) {
            field.addEventListener('focus', function() {
                handleFieldFocus(formId, formName, fieldName, fieldType);
            });
        }

        // Track blur event
        if (config.formTracking.trackBlur) {
            field.addEventListener('blur', function() {
                handleFieldBlur(formId, formName, fieldName, fieldType);
            });
        }

        // Track change event
        if (config.formTracking.trackChange) {
            field.addEventListener('change', function() {
                handleFieldChange(formId, formName, fieldName, fieldType);
            });
        }
    }

    /**
     * Handle field focus event
     */
    function handleFieldFocus(formId, formName, fieldName, fieldType) {
        const formState = state.formStates.get(formId);
        if (!formState) return;

        // Set start time on first interaction
        if (!formState.startTime) {
            formState.startTime = Date.now();
        }
        formState.lastInteractionTime = Date.now();
        formState.fieldsInteracted.add(fieldName);
        state.lastActivityTime = Date.now();

        pushToDataLayer({
            event: 'form_field_focus',
            form_id: formId,
            form_name: formName,
            field_name: fieldName,
            field_type: fieldType,
            fields_interacted_count: formState.fieldsInteracted.size
        });
    }

    /**
     * Handle field blur event
     */
    function handleFieldBlur(formId, formName, fieldName, fieldType) {
        const formState = state.formStates.get(formId);
        if (!formState) return;

        formState.lastInteractionTime = Date.now();
        state.lastActivityTime = Date.now();

        pushToDataLayer({
            event: 'form_field_blur',
            form_id: formId,
            form_name: formName,
            field_name: fieldName,
            field_type: fieldType
        });
    }

    /**
     * Handle field change event
     */
    function handleFieldChange(formId, formName, fieldName, fieldType) {
        const formState = state.formStates.get(formId);
        if (!formState) return;

        formState.lastInteractionTime = Date.now();
        formState.fieldsChanged.add(fieldName);
        state.lastActivityTime = Date.now();

        pushToDataLayer({
            event: 'form_field_change',
            form_id: formId,
            form_name: formName,
            field_name: fieldName,
            field_type: fieldType,
            fields_changed_count: formState.fieldsChanged.size
        });
    }

    /**
     * Handle form submission
     */
    function handleFormSubmit(formId, formName, form) {
        const formState = state.formStates.get(formId);
        if (!formState) return;

        formState.submitted = true;
        const timeToComplete = formState.startTime ? 
            Math.round((Date.now() - formState.startTime) / 1000) : 0;

        pushToDataLayer({
            event: 'form_submit',
            form_id: formId,
            form_name: formName,
            fields_interacted_count: formState.fieldsInteracted.size,
            fields_changed_count: formState.fieldsChanged.size,
            time_to_complete_seconds: timeToComplete,
            form_completion_status: 'submitted'
        });
    }

    /**
     * Setup form abandonment detection
     */
    function setupAbandonmentDetection() {
        // Check for abandonment on page unload
        window.addEventListener('beforeunload', function() {
            checkFormAbandonment();
        });

        // Check for abandonment on visibility change
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                checkFormAbandonment();
            }
        });

        // Periodic check for inactivity-based abandonment
        setInterval(function() {
            const inactiveTime = Date.now() - state.lastActivityTime;
            if (inactiveTime > config.formTracking.abandonmentTimeout) {
                checkFormAbandonment();
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Check and report form abandonment
     */
    function checkFormAbandonment() {
        state.formStates.forEach((formState, formId) => {
            // Form was started but not submitted
            if (formState.startTime && !formState.submitted && !formState.abandoned) {
                if (formState.fieldsInteracted.size > 0) {
                    formState.abandoned = true;
                    const timeSpent = Math.round((Date.now() - formState.startTime) / 1000);

                    pushToDataLayer({
                        event: 'form_abandon',
                        form_id: formId,
                        form_name: formState.formName,
                        fields_interacted_count: formState.fieldsInteracted.size,
                        fields_changed_count: formState.fieldsChanged.size,
                        time_spent_seconds: timeSpent,
                        last_field_interacted: Array.from(formState.fieldsInteracted).pop(),
                        form_completion_status: 'abandoned'
                    });
                }
            }
        });
    }


    /**
     * =================================================================================
     * VIDEO ENGAGEMENT TRACKING (Requirements 21.3, 21.5)
     * Tracks play, pause, ended events and progress at 25%, 50%, 75%, 100%
     * Pushes events to dataLayer for GTM integration
     * =================================================================================
     */

    /**
     * Initialize video tracking for all videos on the page
     */
    function initVideoTracking() {
        if (!config.videoTracking.enabled) {
            if (config.debugMode) {
                console.log('[BrightAI Advanced Analytics] Video tracking disabled');
            }
            return;
        }

        // Track HTML5 video elements
        const videos = document.querySelectorAll('video');
        videos.forEach((video, index) => {
            setupVideoTracking(video, index);
        });

        // Track YouTube embeds (if YouTube API is available)
        setupYouTubeTracking();

        // Watch for dynamically added videos
        observeNewVideos();

        if (config.debugMode) {
            console.log('[BrightAI Advanced Analytics] Video tracking initialized for', videos.length, 'videos');
        }
    }

    /**
     * Setup tracking for individual video element
     * @param {HTMLVideoElement} video - Video element
     * @param {number} index - Video index
     */
    function setupVideoTracking(video, index) {
        const videoId = video.id || video.getAttribute('data-video-id') || `video_${index}`;
        const videoTitle = video.getAttribute('data-video-title') || video.title || videoId;

        // Initialize video state
        state.videoStates.set(videoId, {
            videoId: videoId,
            videoTitle: videoTitle,
            duration: 0,
            milestonesReached: new Set(),
            playCount: 0,
            pauseCount: 0,
            totalWatchTime: 0,
            lastPlayTime: null
        });

        // Track play event
        if (config.videoTracking.trackPlay) {
            video.addEventListener('play', function() {
                handleVideoPlay(videoId, videoTitle, video);
            });
        }

        // Track pause event
        if (config.videoTracking.trackPause) {
            video.addEventListener('pause', function() {
                handleVideoPause(videoId, videoTitle, video);
            });
        }

        // Track ended event
        if (config.videoTracking.trackEnded) {
            video.addEventListener('ended', function() {
                handleVideoEnded(videoId, videoTitle, video);
            });
        }

        // Track progress milestones
        video.addEventListener('timeupdate', function() {
            handleVideoProgress(videoId, videoTitle, video);
        });

        // Get duration when metadata is loaded
        video.addEventListener('loadedmetadata', function() {
            const videoState = state.videoStates.get(videoId);
            if (videoState) {
                videoState.duration = video.duration;
            }
        });
    }

    /**
     * Handle video play event
     */
    function handleVideoPlay(videoId, videoTitle, video) {
        const videoState = state.videoStates.get(videoId);
        if (!videoState) return;

        videoState.playCount++;
        videoState.lastPlayTime = Date.now();

        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration) || 0;
        const percentComplete = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

        pushToDataLayer({
            event: 'video_play',
            video_id: videoId,
            video_title: videoTitle,
            video_current_time: currentTime,
            video_duration: duration,
            video_percent_complete: percentComplete,
            video_play_count: videoState.playCount
        });
    }

    /**
     * Handle video pause event
     */
    function handleVideoPause(videoId, videoTitle, video) {
        const videoState = state.videoStates.get(videoId);
        if (!videoState) return;

        videoState.pauseCount++;
        
        // Calculate watch time for this session
        if (videoState.lastPlayTime) {
            videoState.totalWatchTime += (Date.now() - videoState.lastPlayTime) / 1000;
            videoState.lastPlayTime = null;
        }

        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration) || 0;
        const percentComplete = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

        pushToDataLayer({
            event: 'video_pause',
            video_id: videoId,
            video_title: videoTitle,
            video_current_time: currentTime,
            video_duration: duration,
            video_percent_complete: percentComplete,
            video_pause_count: videoState.pauseCount,
            video_total_watch_time: Math.round(videoState.totalWatchTime)
        });
    }

    /**
     * Handle video ended event
     */
    function handleVideoEnded(videoId, videoTitle, video) {
        const videoState = state.videoStates.get(videoId);
        if (!videoState) return;

        // Calculate final watch time
        if (videoState.lastPlayTime) {
            videoState.totalWatchTime += (Date.now() - videoState.lastPlayTime) / 1000;
            videoState.lastPlayTime = null;
        }

        const duration = Math.round(video.duration) || 0;

        pushToDataLayer({
            event: 'video_ended',
            video_id: videoId,
            video_title: videoTitle,
            video_duration: duration,
            video_percent_complete: 100,
            video_total_watch_time: Math.round(videoState.totalWatchTime),
            video_completion_status: 'completed'
        });
    }

    /**
     * Handle video progress milestones
     */
    function handleVideoProgress(videoId, videoTitle, video) {
        const videoState = state.videoStates.get(videoId);
        if (!videoState || !video.duration) return;

        const percentComplete = Math.round((video.currentTime / video.duration) * 100);

        // Check each milestone
        config.videoTracking.progressMilestones.forEach(milestone => {
            if (percentComplete >= milestone && !videoState.milestonesReached.has(milestone)) {
                videoState.milestonesReached.add(milestone);

                pushToDataLayer({
                    event: 'video_progress',
                    video_id: videoId,
                    video_title: videoTitle,
                    video_milestone: milestone,
                    video_current_time: Math.round(video.currentTime),
                    video_duration: Math.round(video.duration),
                    video_percent_complete: milestone
                });
            }
        });
    }

    /**
     * Setup YouTube video tracking (if YouTube IFrame API is available)
     */
    function setupYouTubeTracking() {
        // Check for YouTube iframes
        const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
        
        if (youtubeIframes.length === 0) return;

        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Setup tracking when API is ready
        window.onYouTubeIframeAPIReady = function() {
            youtubeIframes.forEach((iframe, index) => {
                setupYouTubeVideoTracking(iframe, index);
            });
        };
    }

    /**
     * Setup tracking for YouTube iframe
     */
    function setupYouTubeVideoTracking(iframe, index) {
        // Ensure iframe has enablejsapi parameter
        let src = iframe.src;
        if (!src.includes('enablejsapi=1')) {
            src += (src.includes('?') ? '&' : '?') + 'enablejsapi=1';
            iframe.src = src;
        }

        const videoId = iframe.id || `youtube_${index}`;
        
        // Initialize state
        state.videoStates.set(videoId, {
            videoId: videoId,
            videoTitle: iframe.title || videoId,
            duration: 0,
            milestonesReached: new Set(),
            playCount: 0,
            pauseCount: 0,
            totalWatchTime: 0,
            lastPlayTime: null
        });

        // Create YouTube player
        new YT.Player(iframe, {
            events: {
                'onStateChange': function(event) {
                    handleYouTubeStateChange(event, videoId);
                }
            }
        });
    }

    /**
     * Handle YouTube player state changes
     */
    function handleYouTubeStateChange(event, videoId) {
        const videoState = state.videoStates.get(videoId);
        if (!videoState) return;

        const player = event.target;
        const videoTitle = player.getVideoData ? player.getVideoData().title : videoId;

        switch (event.data) {
            case YT.PlayerState.PLAYING:
                videoState.playCount++;
                videoState.lastPlayTime = Date.now();
                videoState.duration = player.getDuration();
                
                pushToDataLayer({
                    event: 'video_play',
                    video_id: videoId,
                    video_title: videoTitle,
                    video_provider: 'youtube',
                    video_current_time: Math.round(player.getCurrentTime()),
                    video_duration: Math.round(videoState.duration),
                    video_play_count: videoState.playCount
                });
                break;

            case YT.PlayerState.PAUSED:
                videoState.pauseCount++;
                if (videoState.lastPlayTime) {
                    videoState.totalWatchTime += (Date.now() - videoState.lastPlayTime) / 1000;
                    videoState.lastPlayTime = null;
                }
                
                pushToDataLayer({
                    event: 'video_pause',
                    video_id: videoId,
                    video_title: videoTitle,
                    video_provider: 'youtube',
                    video_current_time: Math.round(player.getCurrentTime()),
                    video_duration: Math.round(videoState.duration),
                    video_pause_count: videoState.pauseCount
                });
                break;

            case YT.PlayerState.ENDED:
                if (videoState.lastPlayTime) {
                    videoState.totalWatchTime += (Date.now() - videoState.lastPlayTime) / 1000;
                    videoState.lastPlayTime = null;
                }
                
                pushToDataLayer({
                    event: 'video_ended',
                    video_id: videoId,
                    video_title: videoTitle,
                    video_provider: 'youtube',
                    video_duration: Math.round(videoState.duration),
                    video_percent_complete: 100,
                    video_total_watch_time: Math.round(videoState.totalWatchTime)
                });
                break;
        }
    }

    /**
     * Observe for dynamically added videos
     */
    function observeNewVideos() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a video element
                        if (node.tagName === 'VIDEO') {
                            const index = state.videoStates.size;
                            setupVideoTracking(node, index);
                        }
                        // Check for video elements inside added node
                        const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
                        videos.forEach((video, i) => {
                            const index = state.videoStates.size + i;
                            setupVideoTracking(video, index);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    /**
     * =================================================================================
     * ENHANCED SCROLL DEPTH TRACKING (Requirements 21.4, 21.5)
     * Tracks scroll depth at 25% intervals
     * Pushes events to dataLayer for GTM integration
     * =================================================================================
     */

    /**
     * Initialize enhanced scroll depth tracking
     */
    function initScrollDepthTracking() {
        if (!config.scrollDepth.enabled) {
            if (config.debugMode) {
                console.log('[BrightAI Advanced Analytics] Scroll depth tracking disabled');
            }
            return;
        }

        // Calculate scroll percentage
        function getScrollPercentage() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            
            if (scrollHeight <= 0) return 100; // Page fits in viewport
            
            return Math.round((scrollTop / scrollHeight) * 100);
        }

        // Check and fire scroll depth events
        function checkScrollDepth() {
            const currentPercentage = getScrollPercentage();
            
            config.scrollDepth.thresholds.forEach(threshold => {
                if (currentPercentage >= threshold && !state.scrollDepthReached.has(threshold)) {
                    state.scrollDepthReached.add(threshold);
                    
                    pushToDataLayer({
                        event: 'scroll_depth',
                        scroll_depth_threshold: threshold,
                        scroll_depth_percentage: threshold + '%',
                        scroll_depth_pixels: Math.round(window.pageYOffset || document.documentElement.scrollTop),
                        page_height: document.documentElement.scrollHeight,
                        viewport_height: document.documentElement.clientHeight
                    });

                    if (config.debugMode) {
                        console.log('[BrightAI Advanced Analytics] Scroll depth reached:', threshold + '%');
                    }
                }
            });
        }

        // Throttled scroll handler
        let scrollTimeout;
        function handleScroll() {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                checkScrollDepth();
                scrollTimeout = null;
            }, 100);
        }

        // Add scroll listener
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Check initial scroll position (in case page loads scrolled)
        checkScrollDepth();

        if (config.debugMode) {
            console.log('[BrightAI Advanced Analytics] Enhanced scroll depth tracking initialized');
        }
    }

    /**
     * Get current scroll depth reached milestones
     * @returns {number[]} Array of reached milestones
     */
    function getScrollDepthReached() {
        return Array.from(state.scrollDepthReached).sort((a, b) => a - b);
    }

    /**
     * =================================================================================
     * PUBLIC API AND INITIALIZATION
     * =================================================================================
     */

    /**
     * Initialize all advanced analytics tracking
     * @param {Object} options - Configuration options
     */
    function init(options = {}) {
        if (state.isInitialized) {
            console.warn('[BrightAI Advanced Analytics] Already initialized');
            return;
        }

        // Merge options with default config
        if (options.heatmap) {
            Object.assign(config.heatmap, options.heatmap);
        }
        if (options.formTracking) {
            Object.assign(config.formTracking, options.formTracking);
        }
        if (options.videoTracking) {
            Object.assign(config.videoTracking, options.videoTracking);
        }
        if (options.scrollDepth) {
            Object.assign(config.scrollDepth, options.scrollDepth);
        }
        if (options.debugMode !== undefined) {
            config.debugMode = options.debugMode;
        }

        // Initialize dataLayer
        initDataLayer();

        // Initialize all tracking modules
        initHeatmapTracking(options.claritySiteId || config.heatmap.siteId);
        initFormTracking();
        initVideoTracking();
        initScrollDepthTracking();

        state.isInitialized = true;

        pushToDataLayer({
            event: 'advanced_analytics_initialized',
            analytics_version: '1.0.0',
            modules_enabled: {
                heatmap: config.heatmap.enabled,
                formTracking: config.formTracking.enabled,
                videoTracking: config.videoTracking.enabled,
                scrollDepth: config.scrollDepth.enabled
            }
        });

        if (config.debugMode) {
            console.log('[BrightAI Advanced Analytics] Initialized successfully with options:', options);
        }
    }

    /**
     * Enable debug mode
     */
    function enableDebug() {
        config.debugMode = true;
        console.log('[BrightAI Advanced Analytics] Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    function disableDebug() {
        config.debugMode = false;
    }

    /**
     * Manually track a custom event
     * @param {string} eventName - Event name
     * @param {Object} eventData - Additional event data
     */
    function trackEvent(eventName, eventData = {}) {
        pushToDataLayer({
            event: eventName,
            ...eventData
        });
    }

    /**
     * Get current tracking state
     * @returns {Object} Current state
     */
    function getState() {
        return {
            isInitialized: state.isInitialized,
            heatmapLoaded: state.heatmapLoaded,
            formsTracked: state.formStates.size,
            videosTracked: state.videoStates.size,
            scrollDepthReached: getScrollDepthReached()
        };
    }

    // Public API
    return {
        init: init,
        enableDebug: enableDebug,
        disableDebug: disableDebug,
        trackEvent: trackEvent,
        pushToDataLayer: pushToDataLayer,
        getState: getState,
        getScrollDepthReached: getScrollDepthReached,
        setClarityTag: setClarityTag,
        identifyClarityUser: identifyClarityUser
    };
})();

// Auto-initialize when DOM is ready (with default config)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize with default config - site ID should be set via init() call
        BrightAIAdvancedAnalytics.init();
    });
} else {
    BrightAIAdvancedAnalytics.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrightAIAdvancedAnalytics;
}
