import {useEffect} from "react";
import messaging from "@react-native-firebase/messaging";


import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_600SemiBold,

} from "@expo-google-fonts/montserrat";

import { Routes } from "./src/routes/index"
import { DonorProvider } from "./src/contexts/donor"

export default function App() {

  // useEffect(()=>{
  //   if(requestUserPermission()){
  //     messaging().getToken().then(token => {
  //       console.log(token)
  //     })     
  //     return unsubscribe;
  //   } else {
  //     console.log("Permissão finalizada");
  //   }

  //   messaging()
  //   .getInitialNotification()
  //   .then(async remoteMessage => {
  //     if (remoteMessage) {
  //       console.log(
  //         'Notification caused app to open from quit state:',
  //         remoteMessage.notification,
  //       );
  //     }
  //   });

  //   messaging().onNotificationOpenedApp(remoteMessage => {
  //     console.log(
  //       'Notification caused app to open from background state:',
  //       remoteMessage.notification,
  //     );

  //   });

  // // Register background handler
  // messaging().setBackgroundMessageHandler(async remoteMessage => {
  //   console.log('Message handled in the background!', remoteMessage);
  // });

  // const unsubscribe = messaging().onMessage(async remoteMessage => {
  //   Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
  //   return unsubscribe;
  // },[]);

  // const requestUserPermission = async () => {
  //   const authStatus = await messaging().requestPermission();
  //   const enabled =
  //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  //   if (enabled) {
  //     console.log('Authorization status')
  //   }
  // }})

  const [fontLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if(!fontLoaded){
    return null; 
  } 


  return (
    <DonorProvider>
      <Routes/>
    </DonorProvider>
  );
}