import { Text, View, Image, useColorScheme} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {

  const peers = require('../../assets/img/Peer.png');
  const Qr = require('../../assets/img/Qr.png');
  const Account = require('../../assets/img/Account.png');
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#000' : '#fff';

  return (

    <SafeAreaView style={{ flex: 1, backgroundColor }}> 

      <View>         
        
        <Text>RAMP</Text>
        
        <View>
          <Image source={peers} />
          <Image source={Account} />
        </View>

      </View>

    </SafeAreaView>

  );
}
