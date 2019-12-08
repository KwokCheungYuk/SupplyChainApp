# SupplyChainApp
基于区块链的供应链应用



### 环境配置

1. nodejs
2. npm
3. ganache
4. truffle 

### 使用方法

- 开启ganache，终端输入如下命令

  ```
  ganache-cli
  ```

- 修改SupplyChainApp/contracts/SupplyChain.sol中的银行地址

  ganache会给出10个地址，自行选一个即可

- 新建终端进入SupplyChainApp/app，进行 truffle移植 

  ```
  truffle migrate
  ```

- 开启服务器

  ```
  npm run dev
  ```

- 访问网址

   浏览器输入[http://localhost:8080/](https://blog.csdn.net/gzx1002/article/details/103110197)

