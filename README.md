一个代理docker镜像的Cloudflare Worker，不需要配置，部署即用。

直接通过下面命令发布即可：

```powershell
npx wrangler deploy
```

因为[docker增加了pull限制](https://docs.docker.com/docker-hub/usage/)，所以需要运行`docker login proxy.domain`来登录下，就用docker的用户和[PAT](https://docs.docker.com/security/access-tokens/)就行。

---

**参考**

- [ciiiii/cloudflare-docker-proxy: A docker registry proxy run on cloudflare worker.](https://github.com/ciiiii/cloudflare-docker-proxy)
