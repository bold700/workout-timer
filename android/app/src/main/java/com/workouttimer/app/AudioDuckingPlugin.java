package com.workouttimer.app;

import android.media.AudioManager;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioDucking")
public class AudioDuckingPlugin extends Plugin {

    private AudioManager audioManager;
    private int originalVolume;
    private boolean isDucked = false;
    private int originalStreamVolume;

    @Override
    public void load() {
        super.load();
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void duckVolume(PluginCall call) {
        Integer level = call.getInt("level");
        if (level == null) {
            call.reject("Level parameter is required");
            return;
        }

        try {
            // Request audio focus with ducking capability
            int result = audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            );

            if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                // Store original volume
                originalStreamVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                
                // Calculate new volume based on duck level
                int newVolume = (int) (maxVolume * (level / 100.0));
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, newVolume, 0);
                
                isDucked = true;
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } else {
                call.reject("Failed to request audio focus");
            }
        } catch (Exception e) {
            call.reject("Failed to duck audio: " + e.getMessage());
        }
    }

    @PluginMethod
    public void restoreVolume(PluginCall call) {
        try {
            // Abandon audio focus
            audioManager.abandonAudioFocus(null);
            
            // Restore original volume
            if (isDucked) {
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, originalStreamVolume, 0);
            }
            
            isDucked = false;
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to restore audio: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isDucked(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isDucked", isDucked);
        call.resolve(ret);
    }
}
