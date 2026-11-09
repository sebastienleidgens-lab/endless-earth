declare module 'virtual:build-identity' {
 export const buildIdentity:{
  app:string;
  mission:{number:string;name:string;source:string}|null;
  commit:string|null;
  shortCommit:string|null;
  dirty:boolean|null;
  environment:'development'|'production';
 };
}
