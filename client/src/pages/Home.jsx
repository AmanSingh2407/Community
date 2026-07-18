import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Users, Video, BookOpen, MapPin, TrendingUp, Users2, Heart, Share2, MessageCircle, Camera, X, Upload, Check } from 'lucide-react';

const CAROUSEL_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    title: 'I SUPPORT SONAM WANGCHUK',
    subtitle: 'For Education. For Environment. For Ladakh\'s Future.',
    primaryCTA: 'Support Now',
    secondaryCTA: 'Join Community'
  },
  {
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    title: 'SAVE LADAKH\'S GLACIERS',
    subtitle: 'Protect the third pole. Support climate safeguards under Schedule VI.',
    primaryCTA: 'Learn More',
    secondaryCTA: 'Pledge Support'
  },
  {
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
    title: 'MOUNTAIN EDUCATION CRISIS',
    subtitle: 'Fostering local solar-heated school models and hands-on learning.',
    primaryCTA: 'View Projects',
    secondaryCTA: 'Contribute'
  }
];

const CAMPAIGN_FRAMES = [
  {
    id: 'f1',
    name: 'I Support Gold Banner',
    headerText: 'TOGETHER FOR A BETTER FUTURE',
    footerText: 'I SUPPORT SONAM WANGCHUK',
    color: '#f59e0b'
  },
  {
    id: 'f2',
    name: 'Save Ladakh Glaciers',
    headerText: 'PROTECT THE THIRD POLE',
    footerText: 'SAVE LADAKH GLACIERS #ScheduleVI',
    color: '#0ea5e9'
  },
  {
    id: 'f3',
    name: 'Reinventing Mountain Education',
    headerText: 'SOLAR-HEATED GREEN SCHOOLS',
    footerText: 'REINVENTING EDUCATION',
    color: '#10b981'
  }
];

const PHOTO_FILTERS = [
  { id: 'none', name: 'Normal', filterStyle: 'none' },
  { id: 'warm', name: 'Warm', filterStyle: 'sepia(25%) saturate(130%) contrast(95%)' },
  { id: 'cool', name: 'Cool', filterStyle: 'hue-rotate(20deg) saturate(110%) contrast(105%)' },
  { id: 'monochrome', name: 'B&W', filterStyle: 'grayscale(100%)' },
  { id: 'vintage', name: 'Vintage', filterStyle: 'sepia(45%) contrast(90%) brightness(95%)' },
  { id: 'sat', name: 'Vibrant', filterStyle: 'saturate(150%) contrast(110%)' }
];

const SIMULATED_COMMENTS = [
  { sender: 'Pema Tsering', message: 'Joined the broadcast!' },
  { sender: 'Tashi Dorjay', message: 'Greetings from Leh! We are watching together.' },
  { sender: 'Rigzin Angmo', message: 'Protect the third pole! 🏔️' },
  { sender: 'Kartik Sharma', message: 'Supporting from Delhi! ✊' },
  { sender: 'Rigzin Angmo', message: 'Sent 💖 support hearts!' },
  { sender: 'Sonam Wangchuk', message: 'Keep inspiring the youth, Aman!' },
  { sender: 'Tashi Dorjay', message: 'How can we join the Leh cleanups this weekend?' },
  { sender: 'Pema Tsering', message: 'Jai Hind! 🇮🇳' },
  { sender: 'Kartik Sharma', message: 'The voice of Ladakh is echoing everywhere!' }
];

const Home = ({ onNavigate }) => {
  const { user, getToken, setUser } = useAuth();
  const [stats, setStats] = useState({
    supporters: 0,
    vlogs: 0,
    blogs: 0,
    cities: 0,
    today_growth: 0,
    members: 0
  });
  
  const [slideIndex, setSlideIndex] = useState(0);
  const [feed, setFeed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [pledged, setPledged] = useState(false);
  const [pledgeError, setPledgeError] = useState('');
  const [pledgeLoading, setPledgeLoading] = useState(false);

  // Joined chapters state
  const [joinedChapters, setJoinedChapters] = useState(() => {
    const saved = localStorage.getItem('joined_chapters');
    return saved ? JSON.parse(saved) : ['c1'];
  });
  const [joinLoading, setJoinLoading] = useState(false);

  // Story states
  const [storyFeeds, setStoryFeeds] = useState([]);
  const [activeStoryFeed, setActiveStoryFeed] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Advanced Camera / Photo upload states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [uploadMode, setUploadMode] = useState(false); // true = file upload, false = webcam
  const [cameraStream, setCameraStream] = useState(null);
  const [activeFrame, setActiveFrame] = useState(CAMPAIGN_FRAMES[0]);
  const [activeFilter, setActiveFilter] = useState('none');
  const [addIndianFlag, setAddIndianFlag] = useState(true);
  const [customHeader, setCustomHeader] = useState(CAMPAIGN_FRAMES[0].headerText);
  const [customFooter, setCustomFooter] = useState(CAMPAIGN_FRAMES[0].footerText);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  
  // Custom manual font styling and coordinate positions
  const [headerColor, setHeaderColor] = useState('#ffffff');
  const [footerColor, setFooterColor] = useState(CAMPAIGN_FRAMES[0].color);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  
  const [flagAlign, setFlagAlign] = useState('top-right');
  const [flagX, setFlagX] = useState(0);
  const [flagY, setFlagY] = useState(0);

  const [emojiAlign, setEmojiAlign] = useState('top-left');
  const [emojiX, setEmojiX] = useState(0);
  const [emojiY, setEmojiY] = useState(0);
  const [uploadSrc, setUploadSrc] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Video Story upload and Music States
  const [uploadedVideoFile, setUploadedVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [selectedMusic, setSelectedMusic] = useState('');
  const [isPlayingMusicPreview, setIsPlayingMusicPreview] = useState(false);

  
  // Live Broadcast states
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [liveStream, setLiveStream] = useState(null);
  const [liveViewerCount, setLiveViewerCount] = useState(0);
  const [liveComments, setLiveComments] = useState([]);
  const [liveDuration, setLiveDuration] = useState(0);
  const [myLiveComment, setMyLiveComment] = useState('');
  const [liveSummary, setLiveSummary] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const liveTimerRef = useRef(null);
  const liveCommentsTimerRef = useRef(null);
  const liveViewersTimerRef = useRef(null);

  // Fetch stories directly from database
  const fetchStories = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/stories/feed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStoryFeeds(data.feeds || []);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  // Fetch feed posts
  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts?limit=10`);
      const data = await res.json();
      if (data.success) {
        setFeed(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    }
  };

  // Fetch trending posts (recent vlogs)
  const fetchTrending = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts?type=vlog&limit=3`);
      const data = await res.json();
      if (data.success) {
        setTrending(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch trending posts:', err);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    
    fetchStats();
    fetchStories();
    fetchFeed();
    fetchTrending();
    
    if (user && user.points > 100) {
      setPledged(true);
    }
  }, [user]);

  // Auto-rotating Hero Carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Autoplay handler for stories
  useEffect(() => {
    if (!activeStoryFeed) return;
    
    const maxStories = activeStoryFeed.stories.length;
    const timer = setTimeout(() => {
      if (activeStoryIndex < maxStories - 1) {
        setActiveStoryIndex(prev => prev + 1);
      } else {
        setActiveStoryFeed(null);
        setActiveStoryIndex(0);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeStoryFeed, activeStoryIndex]);

  // Clean up Live broadcast resources on unmount
  useEffect(() => {
    return () => {
      clearInterval(liveTimerRef.current);
      clearInterval(liveCommentsTimerRef.current);
      clearInterval(liveViewersTimerRef.current);
      if (liveStream) {
        liveStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [liveStream]);

  // Comments Auto-scroller logic
  useEffect(() => {
    if (isBroadcasting) {
      const container = document.getElementById('liveCommentsList');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [liveComments, isBroadcasting]);

  // Camera Webcam Trigger
  const handleOpenCamera = async () => {
    setCameraError('');
    setCapturedImage(null);
    setUploadSrc(null);
    setUploadMode(false);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Webcam access denied. Please allow camera permissions or upload a photo instead.');
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setCameraStream(null);
    setShowCameraModal(false);
    setCapturedImage(null);
    setUploadSrc(null);
    setUploadedVideoFile(null);
    setVideoPreviewUrl('');
    setSelectedMusic('');
    setIsPlayingMusicPreview(false);
  };

  // File upload handler (supports both images and videos)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Stop webcam if active
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl('');
    }

    // Check if the uploaded file is a video
    if (file.type.startsWith('video/')) {
      setUploadedVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setUploadSrc(null);
      setCapturedImage(null);
    } else {
      // Treat as image file
      setUploadedVideoFile(null);
      setVideoPreviewUrl('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadSrc(event.target.result);
        setCapturedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };


  // Native Vector Indian Flag Drawer
  const drawIndianFlagSticker = (context, x, y, width, height) => {
    const stripeHeight = height / 3;
    
    // Saffron Stripe
    context.fillStyle = '#FF9933';
    context.fillRect(x, y, width, stripeHeight);
    
    // White Stripe
    context.fillStyle = '#FFFFFF';
    context.fillRect(x, y + stripeHeight, width, stripeHeight);
    
    // Green Stripe
    context.fillStyle = '#138808';
    context.fillRect(x, y + stripeHeight * 2, width, stripeHeight);
    
    // Ashoka Chakra
    const cx = x + width / 2;
    const cy = y + stripeHeight * 1.5;
    const radius = stripeHeight * 0.4;
    
    context.strokeStyle = '#000080';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(cx, cy, radius, 0, 2 * Math.PI);
    context.stroke();
    
    // Spokes
    for (let i = 0; i < 24; i++) {
      const angle = (i * 2 * Math.PI) / 24;
      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      context.stroke();
    }
  };

  // Canvas processing framework
  const drawCanvasFrame = (sourceImageElement) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    context.filter = 'none';
    context.clearRect(0, 0, 640, 480);
    
    // 1. Apply Instagram filter
    const selectedFilter = PHOTO_FILTERS.find(f => f.id === activeFilter);
    context.filter = selectedFilter ? selectedFilter.filterStyle : 'none';
    
    // 2. Draw Source Image
    if (uploadMode) {
      context.drawImage(sourceImageElement, 0, 0, 640, 480);
    } else {
      // Mirror webcam display
      context.translate(640, 0);
      context.scale(-1, 1);
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    // Reset filters for overlays
    context.filter = 'none';
    
    // 3. Draw Banners
    context.fillStyle = 'rgba(0, 0, 0, 0.45)';
    context.fillRect(0, 0, 640, 50);
    context.fillRect(0, 430, 640, 50);

    context.fillStyle = headerColor;
    context.font = `bold 20px ${fontFamily}`;
    context.textAlign = 'center';
    context.fillText(customHeader, 320, 32);

    context.fillStyle = footerColor;
    context.font = `bold 22px ${fontFamily}`;
    context.fillText(customFooter, 320, 462);
    
    // 4. Draw Indian Flag with Dynamic Position Adjustments
    if (addIndianFlag) {
      let fx = 540;
      let fy = 65;
      if (flagAlign === 'top-left') {
        fx = 20;
        fy = 65;
      } else if (flagAlign === 'top-right') {
        fx = 540;
        fy = 65;
      } else if (flagAlign === 'bottom-left') {
        fx = 20;
        fy = 365;
      } else if (flagAlign === 'bottom-right') {
        fx = 540;
        fy = 365;
      }
      fx += flagX;
      fy += flagY;
      drawIndianFlagSticker(context, fx, fy, 75, 50);
    }

    // 5. Draw Custom Emoji Sticker with Dynamic Position Adjustments
    if (selectedEmoji) {
      let ex = 35;
      let ey = 110;
      if (emojiAlign === 'top-left') {
        ex = 35;
        ey = 110;
      } else if (emojiAlign === 'top-right') {
        ex = 560;
        ey = 110;
      } else if (emojiAlign === 'center') {
        ex = 295;
        ey = 240;
      } else if (emojiAlign === 'bottom-left') {
        ex = 35;
        ey = 410;
      } else if (emojiAlign === 'bottom-right') {
        ex = 560;
        ey = 410;
      }
      ex += emojiX;
      ey += emojiY;
      
      context.font = '48px serif';
      context.textAlign = emojiAlign === 'center' ? 'center' : 'left';
      context.fillText(selectedEmoji, ex, ey);
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
  };

  const handleCapture = () => {
    if (uploadMode) {
      if (!uploadSrc) return;
      const img = new Image();
      img.onload = () => {
        drawCanvasFrame(img);
      };
      img.src = uploadSrc;
    } else {
      if (!videoRef.current) return;
      drawCanvasFrame(videoRef.current);
    }
  };

  const handlePublishStory = async () => {
    // We must have either a captured canvas image or an uploaded video file
    if (!capturedImage && !uploadedVideoFile) {
      setCameraError('Please capture an image or upload a video file first.');
      return;
    }

    setCameraLoading(true);
    try {
      const token = getToken();
      let res;

      if (uploadedVideoFile) {
        // Multipart Form-Data for video file uploads
        const formData = new FormData();
        formData.append('media', uploadedVideoFile);
        if (selectedMusic) {
          formData.append('stickers', JSON.stringify({ music: selectedMusic }));
        }

        res = await fetch(`${API_URL}/api/stories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Standard JSON request for base64 captured images
        res = await fetch(`${API_URL}/api/stories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ media_url: capturedImage })
        });
      }

      const data = await res.json();
      if (data.success) {
        handleCloseCamera();
        fetchStories();
        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));
      } else {
        setCameraError(data.error || 'Failed to publish story');
      }
    } catch (err) {
      setCameraError('Server network error. Please try again.');
    } finally {
      setCameraLoading(false);
    }
  };


  // Support Now Pledge Action
  const handleSupportNow = async () => {
    if (!user) {
      if (onNavigate) onNavigate('auth');
      return;
    }
    if (pledged) return;
    setPledgeLoading(true);
    setPledgeError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/stats/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setPledged(true);
        setStats(prev => ({ ...prev, supporters: prev.supporters + 1 }));
        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));
      } else {
        setPledgeError(data.error || 'Failed to pledge support');
        if (data.error && data.error.includes('already')) {
          setPledged(true);
        }
      }
    } catch (err) {
      setPledgeError('Connection error. Please try again.');
    } finally {
      setPledgeLoading(false);
    }
  };

  // Join Community Banner Action
  const handleJoinCommunityAction = async () => {
    if (!user) {
      if (onNavigate) onNavigate('auth');
      return;
    }
    const isJoined = joinedChapters.includes('c1');
    
    if (isJoined) {
      if (onNavigate) onNavigate('communities');
      return;
    }

    setJoinLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/c1/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        const updated = [...joinedChapters, 'c1'];
        setJoinedChapters(updated);
        localStorage.setItem('joined_chapters', JSON.stringify(updated));
        
        setStats(prev => ({ ...prev, members: prev.members + 1 }));

        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));

        alert('You have successfully joined the Ladakh Youth Chapter! +30 points awarded.');
      }
      
      if (onNavigate) onNavigate('communities');
    } catch (err) {
      const updated = [...joinedChapters, 'c1'];
      setJoinedChapters(updated);
      localStorage.setItem('joined_chapters', JSON.stringify(updated));
      if (onNavigate) onNavigate('communities');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      if (onNavigate) onNavigate('auth');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setFeed(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes_count: data.liked ? p.likes_count + 1 : Math.max(p.likes_count - 1, 0)
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // GO LIVE BROADCAST HANDLERS
  const handleStartLiveSetup = async () => {
    setCameraError('');
    setLiveSummary(null);
    setIsBroadcasting(false);
    setLiveComments([]);
    setLiveViewerCount(0);
    setLiveDuration(0);
    setShowLiveModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false 
      });
      setLiveStream(stream);
      setTimeout(() => {
        const liveVid = document.getElementById('liveVideoPreview');
        if (liveVid) liveVid.srcObject = stream;
      }, 100);
    } catch (err) {
      setCameraError('Webcam access denied. Live broadcast requires camera permissions.');
    }
  };

  const handleStartBroadcast = () => {
    setIsBroadcasting(true);
    setLiveViewerCount(1);
    setLiveComments([{ id: 'sys1', sender: 'System', message: 'You are now LIVE!', isSystem: true }]);
    
    // Start Broadcast Clock
    liveTimerRef.current = setInterval(() => {
      setLiveDuration(prev => prev + 1);
    }, 1000);

    // Dynamic viewers fluctuation loop
    liveViewersTimerRef.current = setInterval(() => {
      setLiveViewerCount(prev => {
        if (prev < 10) return prev + Math.floor(Math.random() * 3) + 1;
        const change = Math.random() > 0.45 ? 1 : -1;
        const delta = Math.floor(Math.random() * 4) * change;
        return Math.max(prev + delta, 4);
      });
    }, 3000);

    // simulated live comments stream loop
    let commentIndex = 0;
    liveCommentsTimerRef.current = setInterval(() => {
      if (commentIndex < SIMULATED_COMMENTS.length) {
        const nextComment = SIMULATED_COMMENTS[commentIndex];
        setLiveComments(prev => [...prev, {
          id: `sim-${Date.now()}-${commentIndex}`,
          sender: nextComment.sender,
          message: nextComment.message
        }]);
        commentIndex++;
      } else {
        const randomNames = ['Tashi Dorjay', 'Rigzin Angmo', 'Pema Tsering', 'Kartik Sharma', 'Sonam Wangchuk'];
        const randomTexts = [
          'Supporting you all from Leh! ✊',
          'Let\'s make Ladakh green again! 🏔️',
          'Awesome livestream, Aman!',
          'Sent support hearts! 💖',
          'Saffron flag in our hearts! 🇮🇳',
          'Amazing session!',
          'We stand with Sonam sir!'
        ];
        const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
        setLiveComments(prev => [...prev, {
          id: `sim-rand-${Date.now()}`,
          sender: randomName,
          message: randomText
        }]);
      }
    }, 3500);
  };

  const handleEndBroadcast = async () => {
    // Clear Loops
    clearInterval(liveTimerRef.current);
    clearInterval(liveCommentsTimerRef.current);
    clearInterval(liveViewersTimerRef.current);
    
    if (liveStream) {
      liveStream.getTracks().forEach(track => track.stop());
    }
    setLiveStream(null);
    setIsBroadcasting(false);

    // Award +50 points for broadcasting
    const pointsAwarded = 50;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/rewards/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action_type: 'live_broadcast',
          points: pointsAwarded
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));
      }
    } catch (err) {
      console.error('Offline / failed adding points:', err);
    }

    setLiveSummary({
      peakViewers: Math.max(liveViewerCount, 12),
      duration: liveDuration,
      pointsEarned: pointsAwarded
    });
  };

  const handleCloseLiveModal = () => {
    clearInterval(liveTimerRef.current);
    clearInterval(liveCommentsTimerRef.current);
    clearInterval(liveViewersTimerRef.current);
    if (liveStream) {
      liveStream.getTracks().forEach(track => track.stop());
    }
    setLiveStream(null);
    setShowLiveModal(false);
    setLiveSummary(null);
  };

  const handleSendMyComment = (e) => {
    e.preventDefault();
    if (!myLiveComment.trim()) return;
    
    setLiveComments(prev => [...prev, {
      id: `my-${Date.now()}`,
      sender: user.name,
      message: myLiveComment,
      isSelf: true
    }]);
    setMyLiveComment('');
  };

  const isPrimaryChapterJoined = joinedChapters.includes('c1');
  const activeFilterStyle = PHOTO_FILTERS.find(f => f.id === activeFilter)?.filterStyle || 'none';

  const getFlagPreviewStyle = () => {
    const style = { position: 'absolute', zIndex: 20 };
    if (flagAlign === 'top-left') {
      style.top = `${56 + flagY}px`;
      style.left = `${16 + flagX}px`;
    } else if (flagAlign === 'top-right') {
      style.top = `${56 + flagY}px`;
      style.right = `${16 - flagX}px`;
    } else if (flagAlign === 'bottom-left') {
      style.bottom = `${56 - flagY}px`;
      style.left = `${16 + flagX}px`;
    } else if (flagAlign === 'bottom-right') {
      style.bottom = `${56 - flagY}px`;
      style.right = `${16 - flagX}px`;
    }
    return style;
  };

  const getEmojiPreviewStyle = () => {
    const style = { position: 'absolute', zIndex: 20 };
    if (emojiAlign === 'top-left') {
      style.top = `${56 + emojiY}px`;
      style.left = `${24 + emojiX}px`;
    } else if (emojiAlign === 'top-right') {
      style.top = `${56 + emojiY}px`;
      style.right = `${24 - emojiX}px`;
    } else if (emojiAlign === 'center') {
      style.top = `calc(50% + ${emojiY}px)`;
      style.left = `calc(50% + ${emojiX}px)`;
      style.transform = 'translate(-50%, -50%)';
    } else if (emojiAlign === 'bottom-left') {
      style.bottom = `${56 - emojiY}px`;
      style.left = `${24 + emojiX}px`;
    } else if (emojiAlign === 'bottom-right') {
      style.bottom = `${56 - emojiY}px`;
      style.right = `${24 - emojiX}px`;
    }
    return style;
  };

  return (
    <div className="space-y-6">
      
      {/* 0. Story Ring Bar */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar border-b border-slate-900/80">
        <button 
          onClick={() => {
            if (!user) {
              if (onNavigate) onNavigate('auth');
            } else {
              handleOpenCamera();
            }
          }}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
        >
          <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center relative overflow-hidden group-hover:border-indigo-500 transition-colors">
            <Camera className="w-5 h-5 text-indigo-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-slate-950 font-bold text-white text-[10px]">
              +
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold group-hover:text-white transition-colors">Your Story</span>
        </button>

        {/* Go Live Pulsing Action Ring */}
        <button 
          onClick={() => {
            if (!user) {
              if (onNavigate) onNavigate('auth');
            } else {
              handleStartLiveSetup();
            }
          }}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group animate-pulse-slow"
        >
          <div className="w-14 h-14 bg-slate-950 border-2 border-dashed border-red-500/60 rounded-full flex items-center justify-center relative overflow-hidden group-hover:border-red-500 transition-colors">
            <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
              <span className="text-red-500 font-black text-[9px] tracking-widest">LIVE</span>
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center border-2 border-slate-950 font-bold text-white text-[9px]"></div>
          </div>
          <span className="text-[10px] text-red-400 font-semibold group-hover:text-red-300 transition-colors">Go Live</span>
        </button>

        {storyFeeds.length > 0 ? (
          storyFeeds.map((feedItem) => (
            <button
              key={feedItem.author_id}
              onClick={() => {
                setActiveStoryFeed(feedItem);
                setActiveStoryIndex(0);
              }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 animate-pulse-slow">
                {feedItem.author_avatar ? (
                  <img
                    src={feedItem.author_avatar.startsWith('http') ? feedItem.author_avatar : `${API_URL}${feedItem.author_avatar}`}
                    alt={feedItem.author_name}
                    className="w-full h-full object-cover rounded-full border-2 border-slate-950"
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400 uppercase">
                    {feedItem.author_name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-300 font-medium truncate w-14 text-center">
                {feedItem.author_name.split(' ')[0]}
              </span>
            </button>
          ))
        ) : (
          <span className="text-[10px] text-slate-500 italic py-4 pl-2 text-center">No active stories</span>
        )}
      </div>

      {/* 1. Hero Banner Carousel */}
      <div className="relative rounded-2xl overflow-hidden h-72 border border-slate-800 shadow-2xl bg-slate-900 group">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.95) 20%, rgba(15,23,42,0.4) 60%, rgba(15,23,42,0.1)), url(${CAROUSEL_SLIDES[slideIndex].image})`
          }}
        ></div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Campaign Feature</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
            {CAROUSEL_SLIDES[slideIndex].title}
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-2 max-w-lg font-medium leading-relaxed">
            {CAROUSEL_SLIDES[slideIndex].subtitle}
          </p>
          
          <div className="flex gap-3 mt-4">
            <button 
              onClick={handleSupportNow}
              disabled={pledged || pledgeLoading}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                pledged 
                  ? 'bg-emerald-600 text-white cursor-default' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
              }`}
            >
              {pledgeLoading ? 'Processing...' : pledged ? '✓ Supported' : 'Support Now'}
            </button>
            <button 
              onClick={handleJoinCommunityAction}
              disabled={joinLoading}
              className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                isPrimaryChapterJoined
                  ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200'
              }`}
            >
              {joinLoading ? 'Joining...' : isPrimaryChapterJoined ? '✓ Joined Community' : 'Join Community'}
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 flex gap-1.5 z-10">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlideIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                slideIndex === idx ? 'bg-amber-400 w-4' : 'bg-slate-600'
              }`}
            ></button>
          ))}
        </div>
      </div>

      {pledgeError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center font-medium">
          {pledgeError}
        </div>
      )}

      {/* 2. Stats Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
        <button 
          onClick={() => onNavigate && onNavigate('communities')}
          className="flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-1">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-white tabular-nums">
            {stats.supporters.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Supporters</span>
        </button>

        <button 
          onClick={() => onNavigate && onNavigate('vlogs')}
          className="flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-1">
            <Video className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-white tabular-nums">
            {stats.vlogs.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Vlogs</span>
        </button>

        <button 
          onClick={() => onNavigate && onNavigate('vlogs')}
          className="flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mb-1">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-white tabular-nums">
            {stats.blogs.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Blogs</span>
        </button>

        <button 
          onClick={() => onNavigate && onNavigate('communities')}
          className="flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-1">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-white tabular-nums">
            {stats.cities.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Cities</span>
        </button>

        <button 
          onClick={() => onNavigate && onNavigate('rewards')}
          className="flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
            +{stats.today_growth.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Today</span>
        </button>

        <button 
          onClick={() => onNavigate && onNavigate('communities')}
          className="flex flex-col items-center p-2 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mb-1">
            <Users2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-white tabular-nums">
            {stats.members.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Members</span>
        </button>
      </div>

      {/* 3. Camera promo card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-900/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Support Filter Camera</h3>
          </div>
          <p className="text-slate-400 text-xs max-w-md">
            Take or upload a photo, apply Instagram filters and frame overlays, and add the Indian Flag sticker.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (!user) {
                if (onNavigate) onNavigate('auth');
              } else {
                handleStartLiveSetup();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-lg"
          >
            <Video className="w-4 h-4" />
            Go Live Broadcast
          </button>
          <button 
            onClick={() => {
              if (!user) {
                if (onNavigate) onNavigate('auth');
              } else {
                handleOpenCamera();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-lg shadow-indigo-950"
          >
            <Camera className="w-4 h-4" />
            Open Camera
          </button>
        </div>
      </div>

      {/* 4. Trending Vlogs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Trending Vlogs</h3>
        </div>
        
        {trending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trending.map((vlog) => (
              <div key={vlog.id} className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700/60 transition-all group">
                <div className="relative h-32 bg-slate-855">
                  <img 
                    src={vlog.cover_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'} 
                    alt={vlog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {vlog.media_url && (
                    <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-200">
                      Vlog File
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-bold line-clamp-1 text-slate-200 group-hover:text-white transition-colors">
                    {vlog.title}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{vlog.author_name || 'Supporter'}</span>
                    <button 
                      onClick={() => handleLike(vlog.id)}
                      className="flex items-center gap-0.5 text-indigo-400 font-medium"
                    >
                      <Heart className="w-3 h-3 fill-indigo-400/10" />
                      <span>{vlog.likes_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs italic">
            No trending vlogs yet. Create one!
          </div>
        )}
      </div>

      {/* 5. Community Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Community Feed</h3>
        
        {feed.length > 0 ? (
          <div className="space-y-4">
            {feed.map((post) => (
              <div key={post.id} className="bg-slate-900 border border-slate-800/85 rounded-2xl p-4 md:p-5 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-800 border border-slate-700/60 rounded-full flex items-center justify-center font-bold text-xs text-indigo-400">
                      {post.author_name ? post.author_name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{post.author_name || 'Supporter'}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                          {post.city || 'National'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {post.body}
                </p>

                {post.type === 'vlog' && post.media_url ? (
                  <div className="rounded-xl overflow-hidden bg-black max-h-96 border border-slate-800 flex justify-center">
                    <video controls className="w-full max-h-96" src={`${API_URL}${post.media_url}`} />
                  </div>
                ) : post.cover_image ? (
                  <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-60">
                    <img 
                      src={post.cover_image.startsWith('http') ? post.cover_image : `${API_URL}${post.cover_image}`} 
                      alt="Cover" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-xs">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 hover:text-red-400 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{post.likes_count}</span>
                  </button>
                  
                  <button 
                    onClick={() => onNavigate('vlogs')}
                    className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments_count}</span>
                  </button>

                  <button className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs italic">
            Feed is currently empty. Be the first to publish a post!
          </div>
        )}
      </div>

      {/* STORY VIEWER MODAL */}
      {activeStoryFeed && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
            {activeStoryFeed.stories.map((s, idx) => (
              <div key={s.id} className="h-1 bg-slate-800 flex-1 rounded overflow-hidden">
                <div 
                  className={`h-full bg-indigo-500 ${
                    idx < activeStoryIndex 
                      ? 'w-full' 
                      : idx === activeStoryIndex 
                        ? 'animate-progress-story' 
                        : 'w-0'
                  }`}
                  style={{
                    animationDuration: '5000ms',
                    animationFillMode: 'forwards'
                  }}
                ></div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-indigo-400 border border-slate-700">
                {activeStoryFeed.author_name.charAt(0)}
              </div>
              <span className="text-xs font-bold text-white">{activeStoryFeed.author_name}</span>
            </div>
            <button 
              onClick={() => setActiveStoryFeed(null)} 
              className="p-1 rounded-full bg-slate-900/60 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 relative">
            {activeStoryFeed.stories[activeStoryIndex].media_type === 'video' || /\.(mp4|webm|mov)$/i.test(activeStoryFeed.stories[activeStoryIndex].media_url) ? (
              <div className="relative max-h-[70vh] rounded-2xl border border-slate-900 overflow-hidden flex items-center justify-center shadow-2xl">
                <video 
                  src={`${activeStoryFeed.stories[activeStoryIndex].media_url.startsWith('http') ? '' : API_URL}${activeStoryFeed.stories[activeStoryIndex].media_url}`} 
                  autoPlay 
                  playsInline 
                  controls 
                  loop 
                  className="max-h-[70vh] object-contain" 
                />
                
                {/* Floating Campaign Music Label Overlay */}
                {(() => {
                  let musicTrack = null;
                  try {
                    const rawStickers = activeStoryFeed.stories[activeStoryIndex].stickers;
                    const parsed = typeof rawStickers === 'string' ? JSON.parse(rawStickers) : rawStickers;
                    musicTrack = parsed?.music;
                  } catch (e) {}
                  
                  if (!musicTrack) return null;
                  return (
                    <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-sm border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 text-white animate-pulse shadow-lg z-30">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">🎵 Music:</span>
                      <span className="text-[11px] font-bold text-slate-100">{musicTrack}</span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <img 
                src={activeStoryFeed.stories[activeStoryIndex].media_url.startsWith('data:') 
                  ? activeStoryFeed.stories[activeStoryIndex].media_url 
                  : `${activeStoryFeed.stories[activeStoryIndex].media_url.startsWith('http') ? '' : API_URL}${activeStoryFeed.stories[activeStoryIndex].media_url}`}
                alt="Story" 
                className="max-h-[70vh] rounded-2xl border border-slate-900 object-contain shadow-2xl"
              />
            )}
          </div>

          <div className="flex items-center justify-around bg-slate-950/80 p-3 rounded-2xl border border-slate-900/60 z-20">
            {['💙', '✊', '🔥', '👏', '🙌'].map((emoji) => (
              <button 
                key={emoji}
                onClick={() => setActiveStoryFeed(null)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WEBCAM CAMERA MODAL WITH OVERLAYS, DYNAMIC FILTERS, AND IMAGE UPLOADS */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={handleCloseCamera}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Campaign Selfie Filter</h3>
              <p className="text-slate-400 text-xs mt-1">Design and publish custom campaign stories</p>
            </div>

            {/* Mode Toggle tabs */}
            <div className="flex border-b border-slate-800 text-xs text-center font-bold">
              <button
                onClick={() => {
                  setUploadMode(false);
                  setCapturedImage(null);
                  handleOpenCamera(); // trigger webcam
                }}
                className={`flex-1 py-2 transition-colors border-b-2 ${
                  !uploadMode ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Use Live Camera
              </button>
              <button
                onClick={() => {
                  setUploadMode(true);
                  setCapturedImage(null);
                  if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                    setCameraStream(null);
                  }
                }}
                className={`flex-1 py-2 transition-colors border-b-2 ${
                  uploadMode ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Upload Photo File
              </button>
            </div>

            {cameraError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center font-medium">
                {cameraError}
              </div>
            )}

            {/* PREVIEW CONTAINER */}
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {!capturedImage ? (
                uploadMode ? (
                  videoPreviewUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <video 
                        src={videoPreviewUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : uploadSrc ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={uploadSrc} 
                        alt="Uploaded preview" 
                        className="w-full h-full object-cover" 
                        style={{ filter: activeFilterStyle }}
                      />
                      {/* Banners overlay */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
                        <div 
                          className="bg-black/60 p-2 text-center text-xs font-bold uppercase tracking-wider border-b border-white/10"
                          style={{ color: headerColor, fontFamily }}
                        >
                          {customHeader}
                        </div>
                        <div 
                          className="bg-black/60 p-2 text-center text-sm font-bold uppercase tracking-wider border-t border-white/10"
                          style={{ color: footerColor, fontFamily }}
                        >
                          {customFooter}
                        </div>
                      </div>
                      
                      {/* Indian Flag overlay */}
                      {addIndianFlag && (
                        <div 
                          style={getFlagPreviewStyle()}
                          className="w-16 h-10 flex flex-col border border-white/20 shadow-md rounded overflow-hidden select-none pointer-events-none"
                        >
                          <div className="bg-[#FF9933] flex-1"></div>
                          <div className="bg-[#FFFFFF] flex-1 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 rounded-full border border-[#000080] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-[#000080] rounded-full"></div>
                            </div>
                          </div>
                          <div className="bg-[#138808] flex-1"></div>
                        </div>
                      )}

                      {/* Custom Emoji overlay */}
                      {selectedEmoji && (
                        <div 
                          style={getEmojiPreviewStyle()}
                          className="text-4xl select-none animate-bounce-slow font-sans pointer-events-none"
                        >
                          {selectedEmoji}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-slate-500 space-y-3 text-center">
                      <Upload className="w-12 h-12 text-slate-600 animate-pulse" />
                      <div>
                        <button
                          onClick={() => fileInputRef.current.click()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Choose Image or Video
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      <span className="text-[10px] text-slate-600">Supports JPG, PNG, MP4, WebM formats</span>
                    </div>
                  )
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]"
                      style={{ filter: activeFilterStyle }}
                    />
                    
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
                      <div 
                        className="bg-black/60 p-2 text-center text-xs font-bold uppercase tracking-wider border-b border-white/10"
                        style={{ color: headerColor, fontFamily }}
                      >
                        {customHeader}
                      </div>
                      <div 
                        className="bg-black/60 p-2 text-center text-sm font-bold uppercase tracking-wider border-t border-white/10"
                        style={{ color: footerColor, fontFamily }}
                      >
                        {customFooter}
                      </div>
                    </div>

                    {/* Indian Flag overlay */}
                    {addIndianFlag && (
                      <div 
                        style={getFlagPreviewStyle()}
                        className="w-16 h-10 flex flex-col border border-white/20 shadow-md rounded overflow-hidden select-none pointer-events-none"
                      >
                        <div className="bg-[#FF9933] flex-1"></div>
                        <div className="bg-[#FFFFFF] flex-1 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full border border-[#000080] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#000080] rounded-full"></div>
                          </div>
                        </div>
                        <div className="bg-[#138808] flex-1"></div>
                      </div>
                    )}

                    {/* Custom Emoji overlay */}
                    {selectedEmoji && (
                      <div 
                        style={getEmojiPreviewStyle()}
                        className="text-4xl select-none animate-bounce-slow font-sans pointer-events-none"
                      >
                        {selectedEmoji}
                      </div>
                    )}
                  </>
                )
              ) : (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>

            <canvas ref={canvasRef} width="640" height="480" className="hidden" />

            {!capturedImage && (
              <div className="space-y-4">
                {uploadedVideoFile ? (
                  /* Video stories options (music picker) */
                  <div className="space-y-3 bg-slate-950/20 border border-slate-800/80 rounded-2xl p-4">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Select Background Music:</span>
                    <div className="space-y-2 pt-1">
                      {[
                        { name: 'Himalayan Breeze', desc: 'Peaceful acoustic mountain flute loop' },
                        { name: 'March for Ladakh', desc: 'Inspiring drumbeat & progressive campaign rhythm' },
                        { name: 'Nature Zen', desc: 'Calming sounds of stream and valley winds' }
                      ].map((track) => (
                        <button
                          key={track.name}
                          type="button"
                          onClick={() => {
                            setSelectedMusic(selectedMusic === track.name ? '' : track.name);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedMusic === track.name
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-bold text-slate-200">{track.name}</span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">{track.desc}</span>
                          </div>
                          <span className="text-xs">
                            {selectedMusic === track.name ? '🎵 Added' : '➕ Add'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Standard Image Option - Indian Flag overlay toggle */
                  <div className="flex items-center justify-between bg-slate-950/30 p-2.5 border border-slate-800/80 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overlay Indian Flag Sticker</span>
                    <input
                      type="checkbox"
                      checked={addIndianFlag}
                      onChange={(e) => setAddIndianFlag(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* 2. Selecting Instagram-like filters */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Instagram Filters:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PHOTO_FILTERS.map(filter => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`p-2 rounded-lg border text-[10px] font-semibold text-center transition-colors truncate ${
                          activeFilter === filter.id 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Frame selection */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Select Campaign Frame:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {CAMPAIGN_FRAMES.map(frame => (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => {
                          setActiveFrame(frame);
                          setCustomHeader(frame.headerText);
                          setCustomFooter(frame.footerText);
                        }}
                        className={`p-2 rounded-lg border text-[9px] font-bold text-center transition-colors truncate ${
                          activeFrame.id === frame.id 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {frame.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Manual Text Editing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Header Text Override
                    </label>
                    <input
                      type="text"
                      value={customHeader}
                      onChange={(e) => setCustomHeader(e.target.value)}
                      className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Footer Text Override
                    </label>
                    <input
                      type="text"
                      value={customFooter}
                      onChange={(e) => setCustomFooter(e.target.value)}
                      className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* 5. Text Styling Controls */}
                <div className="space-y-3 p-3 bg-slate-950/30 border border-slate-800/80 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Banner Text Styling:</span>
                    
                    {/* Font Family selection */}
                    <div className="flex gap-1.5 text-[9px] font-bold">
                      {[
                        { id: 'sans-serif', name: 'Sans' },
                        { id: 'serif', name: 'Serif' },
                        { id: 'monospace', name: 'Mono' }
                      ].map(font => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setFontFamily(font.id === 'sans-serif' ? 'Inter, sans-serif' : font.id === 'serif' ? 'Georgia, serif' : 'monospace')}
                          className={`px-2.5 py-1 rounded border transition-colors ${
                            (fontFamily.includes('Inter') && font.id === 'sans-serif') || (fontFamily.includes('Georgia') && font.id === 'serif') || (fontFamily.includes('mono') && font.id === 'monospace')
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[9px] font-bold">
                    {/* Header Color Picker */}
                    <div>
                      <label className="block text-slate-400 mb-1">Header Color</label>
                      <div className="flex gap-1.5">
                        {['#ffffff', '#f59e0b', '#0ea5e9', '#10b981'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setHeaderColor(color)}
                            className={`w-5 h-5 rounded-full border transition-all ${
                              headerColor === color ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Footer Color Picker */}
                    <div>
                      <label className="block text-slate-400 mb-1">Footer Color</label>
                      <div className="flex gap-1.5">
                        {['#ffffff', '#f59e0b', '#0ea5e9', '#10b981'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFooterColor(color)}
                            className={`w-5 h-5 rounded-full border transition-all ${
                              footerColor === color ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Custom Emoji Sticker */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Add Emoji Sticker:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* None button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmoji('');
                        setCustomEmojiInput('');
                      }}
                      className={`px-4 h-9 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors ${
                        selectedEmoji === ''
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-650'
                      }`}
                    >
                      None
                    </button>

                    {/* Preset emojis */}
                    {['✊', '🏔️', '🇮🇳', '💖', '🔥', '📢', '🙌'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setCustomEmojiInput('');
                        }}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-colors ${
                          selectedEmoji === emoji && !customEmojiInput
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-650'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}

                    {/* Custom input */}
                    <input
                      type="text"
                      placeholder="✏️ Custom"
                      maxLength="2"
                      value={customEmojiInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomEmojiInput(val);
                        setSelectedEmoji(val);
                      }}
                      className={`h-9 px-3 bg-slate-800/40 border text-xs text-white rounded-lg focus:outline-none text-center transition-colors w-24 ${
                        customEmojiInput 
                          ? 'border-indigo-500 bg-indigo-600/10 text-indigo-400 font-bold' 
                          : 'border-slate-700/60 text-slate-400 hover:border-slate-650'
                      }`}
                    />
                  </div>
                </div>

                {/* 7. Position Customization Panel */}
                <div className="space-y-3 p-3 bg-slate-950/30 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Adjust Overlay Positions:</span>
                  
                  {/* Indian Flag Placement */}
                  {addIndianFlag && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-slate-300">Indian Flag Position:</span>
                        <div className="flex gap-1">
                          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(align => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setFlagAlign(align)}
                              className={`px-1.5 py-0.5 rounded text-[8px] uppercase border transition-colors ${
                                flagAlign === align 
                                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              {align.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Flag Offset Sliders */}
                      <div className="grid grid-cols-2 gap-3 text-[9px] text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span>Horizontal:</span>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            value={flagX}
                            onChange={(e) => setFlagX(parseInt(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="w-6 text-right tabular-nums">{flagX}px</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Vertical:</span>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            value={flagY}
                            onChange={(e) => setFlagY(parseInt(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="w-6 text-right tabular-nums">{flagY}px</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emoji Sticker Placement */}
                  {selectedEmoji && (
                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-slate-300">Emoji Sticker Position:</span>
                        <div className="flex gap-1">
                          {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(align => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setEmojiAlign(align)}
                              className={`px-1.5 py-0.5 rounded text-[8px] uppercase border transition-colors ${
                                emojiAlign === align 
                                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              {align.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Emoji Offset Sliders */}
                      <div className="grid grid-cols-2 gap-3 text-[9px] text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span>Horizontal:</span>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            value={emojiX}
                            onChange={(e) => setEmojiX(parseInt(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="w-6 text-right tabular-nums">{emojiX}px</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Vertical:</span>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            value={emojiY}
                            onChange={(e) => setEmojiY(parseInt(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="w-6 text-right tabular-nums">{emojiY}px</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!capturedImage ? (
                uploadMode ? (
                  <button
                    onClick={handleCapture}
                    disabled={!uploadSrc}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md"
                  >
                    Process Photo & Apply Edits
                  </button>
                ) : (
                  <button
                    onClick={handleCapture}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md"
                  >
                    Capture Photo
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold"
                  >
                    Retake / Reset
                  </button>
                  <button
                    onClick={handlePublishStory}
                    disabled={cameraLoading}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md shadow-indigo-950"
                  >
                    {cameraLoading ? 'Publishing...' : 'Publish to Story (+20 pts)'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIVE BROADCAST CONSOLE MODAL */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-900 rounded-3xl max-w-md w-full overflow-hidden relative shadow-2xl flex flex-col h-[80vh]">
            
            {/* Header Status Bar */}
            <div className="bg-slate-900/60 p-4 border-b border-slate-800/80 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isBroadcasting ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isBroadcasting ? '🔴 LIVE' : 'PREVIEW'}
                </span>
                {isBroadcasting && (
                  <span className="text-slate-400 text-xs font-bold tabular-nums">
                    {Math.floor(liveDuration / 60).toString().padStart(2, '0')}:{(liveDuration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>

              {isBroadcasting && (
                <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-full border border-white/5 text-slate-200 text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="tabular-nums">{liveViewerCount}</span>
                </div>
              )}

              <button 
                onClick={handleCloseLiveModal} 
                className="p-1 rounded-full bg-slate-800/40 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 m-4 rounded-lg text-center font-medium">
                {cameraError}
              </div>
            )}

            {/* Broadcast Viewport */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              {liveStream ? (
                <video 
                  id="liveVideoPreview" 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
              ) : !liveSummary && (
                <div className="text-center space-y-2 p-6">
                  <Video className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
                  <p className="text-slate-500 text-xs italic">Connecting live camera...</p>
                </div>
              )}

              {/* simulated Live Comments List */}
              {isBroadcasting && (
                <div 
                  id="liveCommentsList"
                  className="absolute bottom-16 left-4 right-4 max-h-48 overflow-y-auto flex flex-col gap-1.5 z-20 pointer-events-auto no-scrollbar scroll-smooth"
                >
                  {liveComments.map(c => (
                    <div 
                      key={c.id} 
                      className={`px-3 py-1.5 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                        c.isSystem 
                          ? 'bg-indigo-600/90 text-white font-bold self-center shadow-lg border border-indigo-500/25' 
                          : c.isSelf
                            ? 'bg-slate-800/90 border border-slate-700/40 text-slate-200 self-end shadow'
                            : 'bg-black/55 backdrop-blur-sm text-slate-100 border border-white/5 shadow'
                      }`}
                    >
                      {!c.isSystem && <span className="font-extrabold text-indigo-400 mr-1.5">{c.sender}:</span>}
                      <span>{c.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Broadcast Completed Card */}
              {liveSummary && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur flex flex-col items-center justify-center p-6 text-center z-30 space-y-5 animate-fade-in">
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-wider">Broadcast Ended</h4>
                    <p className="text-slate-400 text-xs mt-1">Thank you for sharing your voice with the community!</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl">
                    <div className="p-1">
                      <span className="block text-slate-500 text-[9px] uppercase tracking-wider font-bold">Duration</span>
                      <span className="block text-sm font-extrabold text-white tabular-nums mt-0.5">
                        {Math.floor(liveSummary.duration / 60).toString().padStart(2, '0')}:{(liveSummary.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="p-1 border-x border-slate-800">
                      <span className="block text-slate-500 text-[9px] uppercase tracking-wider font-bold">Peak Viewers</span>
                      <span className="block text-sm font-extrabold text-white tabular-nums mt-0.5">{liveSummary.peakViewers}</span>
                    </div>
                    <div className="p-1">
                      <span className="block text-slate-500 text-[9px] uppercase tracking-wider font-bold">Points</span>
                      <span className="block text-sm font-extrabold text-emerald-400 tabular-nums mt-0.5">+{liveSummary.pointsEarned}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCloseLiveModal}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    Done & Return
                  </button>
                </div>
              )}
            </div>

            {/* Broadcast Control deck */}
            {!liveSummary && (
              <div className="bg-slate-950 p-4 border-t border-slate-900">
                {!isBroadcasting ? (
                  <button
                    onClick={handleStartBroadcast}
                    disabled={!liveStream}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md font-sans tracking-wide uppercase"
                  >
                    Start Live Broadcast
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Broadcaster chat input */}
                    <form onSubmit={handleSendMyComment} className="flex gap-2">
                      <input
                        type="text"
                        value={myLiveComment}
                        onChange={(e) => setMyLiveComment(e.target.value)}
                        placeholder="Say something to supporters..."
                        className="flex-1 bg-slate-900 border border-slate-850 text-xs text-white rounded-xl px-4 py-2 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                      >
                        Send
                      </button>
                    </form>

                    <button
                      onClick={handleEndBroadcast}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-red-400 rounded-xl text-xs font-bold border border-red-500/20"
                    >
                      End Live Broadcast
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
