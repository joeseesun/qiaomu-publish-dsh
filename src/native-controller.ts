import {Modal,Notice} from './harness-ui';
import {normalizeSettings} from './original/defaults';
import {WechatPublishModal} from './original/publish-modal';
import {ExternalPublishModal} from './original/external-publish-modal';
import {QiaomuPublishSettingTab} from './original/settings-tab';
import {UpdateNotes} from './original/update-notes';

export class PublishController {
 settings:any;manifest={id:'qiaomu-publish-dsh',version:'0.1.0',name:'乔木 Publish'};modals=new Set<any>();listeners=new Set<()=>void>();disposers:Array<()=>void>=[];commands:any[]=[];updateNotes:any;
 constructor(public app:any,public state:any,public save:()=>Promise<any>,public saveNote:()=>Promise<any>){
  this.settings=normalizeSettings(state.data.settings);
  this.updateNotes=new UpdateNotes(this as any,[{version:'0.1.0',items:['harness']}],()=> 'zh');
 }
 register(fn:()=>void){this.disposers.push(fn);}addCommand(command:any){this.commands.push(command);}
 async saveSettings(){this.state.data.settings=normalizeSettings(this.settings);await this.save();for(const fn of this.listeners)fn();}
 onAppearanceChange(fn:()=>void){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 async saveNoteAppearance(path:string,value:any){if(value)this.settings.wechat.noteStyles[path]=structuredClone(value);else delete this.settings.wechat.noteStyles[path];await this.saveSettings();}
 async setDefaultAppearance(value:any){this.settings.wechat.themeId=value.themeId;this.settings.wechat.articleStyle={...value.style};await this.saveSettings();}
 openSettings(){const modal=new Modal(this.app);modal.modalEl.addClass('qpublish-dsh-settings-modal');const tab=new QiaomuPublishSettingTab(this.app,this as any);modal.onOpen=()=>{modal.contentEl.append(tab.containerEl);tab.display();};modal.onClose=()=>tab.hide();this.showModal(modal);}
 openWechatPublish(file:any){void this.saveNote().then(()=>this.showModal(new WechatPublishModal(this.app,file,this as any))).catch(e=>new Notice(e.message));}
 openExternalPublish(file:any,target:any){void this.saveNote().then(()=>this.showModal(new ExternalPublishModal(this.app,file,this as any,target))).catch(e=>new Notice(e.message));}
 openPublish(file:any,choice:any){if(choice==='wechat')this.openWechatPublish(file);else this.openExternalPublish(file,choice);}
 showModal(modal:any){const close=modal.onClose.bind(modal);modal.onClose=()=>{this.modals.delete(modal);close();};this.modals.add(modal);modal.open();}
 dispose(){for(const modal of this.modals)modal.close();this.modals.clear();for(const fn of this.disposers.splice(0))fn();this.listeners.clear();}
}
