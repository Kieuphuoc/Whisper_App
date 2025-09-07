/// 

import { NativeStackScreenProps } from "react-native-screens/lib/typescript/native-stack/types";

export type HomeStackNagivatiorParamList = {
    Home: undefined;
    Accounts: undefined;
    VoiceDetail: undefined;

}

export type HomeScreenNavigationProp=NativeStackScreenProps<HomeStackNagivatiorParamList,
Home, 
Account,
VoiceDetail,
>