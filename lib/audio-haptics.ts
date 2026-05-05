type SoundType = 
  | 'ui_tap'
  | 'ui_select'
  | 'ui_transition'
  | 'hold_charge'
  | 'hold_complete'
  | 'success'
  | 'error'
  | 'message_ping'
  | 'guto_typing_loop';

type FeedbackType = 'tap' | 'select' | 'transition' | 'success' | 'error' | 'message' | 'hold_charge' | 'hold_complete';

const SOUND_VOLUMES: Record<SoundType, number> = {
  ui_tap: 0.1,
  ui_select: 0.3,
  ui_transition: 0.4,
  hold_charge: 0.5,
  hold_complete: 0.6,
  success: 0.6,
  error: 0.4,
  message_ping: 0.3,
  guto_typing_loop: 0.15,
};

const VIBRATION_PATTERNS = {
  tap: 10,
  select: 15,
  transition: 12,
  hold_charge: 20,
  hold_complete: [30, 40, 50],
  message: [20, 30, 20],
  success: [40, 40, 80],
  error: [60, 40, 60],
};

class AudioHapticsManager {
  private audioInstances: Map<SoundType, HTMLAudioElement> = new Map();
  private initialized = false;
  private lastPlayTime: Map<SoundType, number> = new Map();
  private readonly DEBOUNCE_MS = 150;

  constructor() {
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        this.activateFromUserGesture();
        window.removeEventListener('pointerdown', initAudio, true);
        window.removeEventListener('touchstart', initAudio, true);
        window.removeEventListener('click', initAudio, true);
      };

      // Capture phase unlocks the audio pool before React pointer handlers run.
      window.addEventListener('pointerdown', initAudio, { once: true, capture: true });
      window.addEventListener('touchstart', initAudio, { once: true, capture: true });
      window.addEventListener('click', initAudio, { once: true, capture: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopGutoSound('guto_typing_loop');
          this.stopGutoSound('hold_charge');
        }
      });
    }
  }

  private activateFromUserGesture() {
    if (this.initialized) return;
    this.preloadSounds();
    this.initialized = true;
  }

  private preloadSounds() {
    if (typeof window === 'undefined') return;

    Object.keys(SOUND_VOLUMES).forEach((type) => {
      const soundType = type as SoundType;
      try {
        const audio = new Audio(`/audio/${soundType}.mp3`);
        audio.volume = SOUND_VOLUMES[soundType];
        if (soundType === 'guto_typing_loop') {
          audio.loop = true;
        }
        audio.preload = 'auto';
        this.audioInstances.set(soundType, audio);
      } catch (err) {
        console.warn(`[GUTO Audio] Failed to preload ${soundType}`, err);
      }
    });
  }

  public vibrateGuto(patternType: keyof typeof VIBRATION_PATTERNS) {
    if (!this.initialized) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    
    try {
      navigator.vibrate(VIBRATION_PATTERNS[patternType]);
    } catch {
      // iOS Safari and some PWA contexts do not expose vibration. Ignore it.
    }
  }

  public playGutoSound(type: SoundType) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!this.initialized) return;
    if (document.hidden) return;

    const now = Date.now();
    const lastTime = this.lastPlayTime.get(type) || 0;
    
    // Anti-spam / Debounce
    if (now - lastTime < this.DEBOUNCE_MS) {
      return;
    }

    const audio = this.audioInstances.get(type);
    if (!audio) {
      console.warn(`[GUTO Audio] Sound not loaded: ${type}`);
      return;
    }

    try {
      if (type === 'guto_typing_loop' && !audio.paused) return;

      if (type !== 'guto_typing_loop') {
        audio.currentTime = 0;
      }

      // HTMLAudioElement respects browser autoplay policy and OS silent mode.
      // There is no reliable browser API to detect or bypass phone silent mode.
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn(`[GUTO Audio] Failed to play ${type}:`, e);
        });
      }
      this.lastPlayTime.set(type, now);
    } catch (err) {
      console.warn(`[GUTO Audio] Error playing ${type}:`, err);
    }
  }

  public stopGutoSound(type: SoundType) {
    const audio = this.audioInstances.get(type);
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (err) {
        console.warn(`[GUTO Audio] Error stopping ${type}:`, err);
      }
    }
  }

  public playGutoFeedback(type: FeedbackType) {
    switch (type) {
      case 'tap':
        this.playGutoSound('ui_tap');
        this.vibrateGuto('tap');
        break;
      case 'select':
        this.playGutoSound('ui_select');
        this.vibrateGuto('select');
        break;
      case 'transition':
        this.playGutoSound('ui_transition');
        this.vibrateGuto('transition');
        break;
      case 'success':
        this.playGutoSound('success');
        this.vibrateGuto('success');
        break;
      case 'error':
        this.playGutoSound('error');
        this.vibrateGuto('error');
        break;
      case 'message':
        this.playGutoSound('message_ping');
        this.vibrateGuto('message');
        break;
      case 'hold_charge':
        this.playGutoSound('hold_charge');
        this.vibrateGuto('hold_charge');
        break;
      case 'hold_complete':
        this.playGutoSound('hold_complete');
        this.vibrateGuto('hold_complete');
        break;
    }
  }
}

export const gutoAudio = new AudioHapticsManager();
