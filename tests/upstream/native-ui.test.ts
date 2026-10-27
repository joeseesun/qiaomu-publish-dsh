// @vitest-environment happy-dom
import {describe,it,expect,afterEach} from 'vitest';
import {enhance,disposeSurfaces,configureNativeHost} from '../../src/harness-ui';
import {createWorkspace} from '../../src/native-workspace';
import {PublishController} from '../../src/native-controller';
import {WechatPreviewView} from '../../src/original/preview-view';
import {QiaomuPublishSettingTab} from '../../src/original/settings-tab';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildWechatHtml,resolveWechatTheme} from '../../src/original/export-html';
afterEach(()=>{disposeSurfaces();document.body.replaceChildren();});
describe('actual original components on the native DOM boundary',()=>{
 it('opens preview toolbar and all four original settings sections without prototype patching',async()=>{
  expect((HTMLElement.prototype as any).createDiv).toBeUndefined();
  const state={data:{}};const workspace=createWorkspace({}, {files:[]},{state,save:async()=>{}});
  configureNativeHost({});const controller=new PublishController(workspace.app,state,async()=>{},async()=>{});
  const element=enhance(document.createElement('div'));document.body.append(element);const preview=new WechatPreviewView({contentEl:element,app:workspace.app} as any,controller as any);await preview.onOpen();
  expect(element.querySelector('[data-qm-tip="复制公众号格式"]')).toBeTruthy();
  const tab=new QiaomuPublishSettingTab(workspace.app,controller as any);document.body.append(tab.containerEl);tab.display();
  for(const section of ['公众号','浏览器平台','排版与封面','关于']){const button=[...tab.containerEl.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(item=>item.textContent===section)!;button.click();expect(tab.containerEl.querySelector('[aria-selected=true]')?.textContent).toBe(section);}
  tab.hide();await preview.close();controller.dispose();workspace.dispose();expect((HTMLElement.prototype as any).createDiv).toBeUndefined();
 });
 it('keeps the original product stylesheet byte for byte',()=>{
  const bytes=readFileSync(process.cwd()+'/src/original/styles.css');expect(createHash('sha256').update(bytes).digest('hex')).toBe('b7346d464b7a6bbe542cf309a4ef7169d4706e02608f689d53933855475499b8');
 });
 it('retains readable callout text on the original dark themes',()=>{
  const doc=new DOMParser().parseFromString(buildWechatHtml('<blockquote><p>[!note] Title</p><p>Body</p></blockquote>',resolveWechatTheme('linear-night')),'text/html');
  const ink=(doc.querySelector('.wechat-export-content') as HTMLElement).style.color;
  expect((doc.querySelector('.wechat-callout') as HTMLElement).style.color).toBe(ink);expect((doc.querySelector('.wechat-callout-title') as HTMLElement).style.color).toBe(ink);
 });
});
