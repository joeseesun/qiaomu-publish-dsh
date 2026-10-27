import {nativeHost, bytesToBase64} from "../../harness-ui";
import { landingUrl, type BridgeJob, type BridgeStatus } from "./protocol";

/** How long to wait for the extension to pick the job up before concluding it is not there. */
export const PICKUP_TIMEOUT_MS = 45_000;
/** Longest silence tolerated once the extension has started (uploads and the editor can be slow). */
export const IDLE_TIMEOUT_MS = 180_000;

export interface BridgeRun {
  /** Resolves with the final status; never rejects. */
  done: Promise<BridgeStatus>;
  /** URL that was opened, so it can be copied when the wrong browser took it. */
  url: string;
  cancel(): void;
}

export interface BridgeRunOptions {
  job: BridgeJob;
  readAsset(id: string): Promise<{ data: ArrayBuffer; mime: string } | null>;
  open(url: string): void;
  onStatus(status: BridgeStatus): void;
  pickupTimeoutMs?: number;
  idleTimeoutMs?: number;
}

export async function startBridgeRun(options: BridgeRunOptions): Promise<BridgeRun> {
  const api = nativeHost();
  const assets = [];
  for (const asset of options.job.assets) {
    const value = await options.readAsset(asset.id);
    if (!value) throw Error(`Missing publishing asset: ${asset.name}`);
    assets.push({id: asset.id, mime: value.mime, base64: bytesToBase64(new Uint8Array(value.data))});
  }
  const started = await api.bridgeStart({job: options.job, assets});
  let finished = false, timer: ReturnType<typeof setTimeout>;
  let settle!: (status: BridgeStatus) => void;
  const done = new Promise<BridgeStatus>(resolve => {settle = resolve;});
  const finish = (status: BridgeStatus) => {if (finished) return; finished = true; clearTimeout(timer); settle(status);};
  const poll = async () => {
    try { const result = await api.bridgeStatus({id: started.id}); options.onStatus(result.status); if (result.finished) finish(result.status); else timer = setTimeout(poll, 500); }
    catch {void api.bridgeCancel({id: started.id}).catch(()=>{});finish({state:'error',error:{message:'Local publishing service disconnected'}});}
  };
  try { options.open(started.url); } catch (error) {await api.bridgeCancel({id:started.id});throw error;}
  void poll();
  return {done,url:started.url,cancel:()=>{void api.bridgeCancel({id:started.id}).catch(()=>finish({state:'cancelled'}));}};
}
