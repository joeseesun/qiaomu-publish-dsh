import {nativeHost} from "../../harness-ui";
// The loopback listener runs in the Harness Node host.
export function bridgeAvailable(): boolean {try{return !!nativeHost();}catch{return false;}}
