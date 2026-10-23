// Junta os plugins nativos do Capacitor num único ficheiro (www/js/vendor/native-plugins.js),
// para o jogo poder continuar em JavaScript simples, sem bundler.
// Gerar de novo com: npm run build:plugins
import '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { InAppReview } from '@capacitor-community/in-app-review';

window.NativePlugins = { App, Haptics, LocalNotifications, ScreenOrientation, SplashScreen, StatusBar, InAppReview };
