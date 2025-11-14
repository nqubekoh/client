import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class FileService {
  apiUrl = (window as any).__env?.API_URL || 'http://localhost:4000/graphql';


  async list(path: string, cursor?: string, limit = 500) {
    const body = {
      query: `query Directory($path:String!,$cursor:String,$limit:Int){ directory(path:$path,cursor:$cursor,limit:$limit){ entries{ name path size extension createdAt isDirectory permissions uid gid mode } nextCursor } }`,
      variables: { path, cursor, limit }
    };


    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (j.errors) throw j.errors;
    return j.data.directory;
  }
}
