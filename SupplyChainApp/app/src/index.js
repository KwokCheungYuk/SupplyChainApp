import Web3 from "web3";
import metaCoinArtifact from "../../build/contracts/SupplyChain.json";

let accounts;
let company;

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = metaCoinArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        metaCoinArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      company = accounts[0];
      console.log(accounts);
      this.refreshName();
      this.refreshBalance();
      this.refreshCredit();
      const addressElement = document.getElementById("account-address");
      addressElement.innerHTML = this.account;

    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  //切换账号
  changeAccount: function (){

    const account_id = parseInt(document.getElementById('account-input').value)
    if (account_id < 10 && account_id >= 0) 
    {
      const addressElement = document.getElementById("account-address");
      this.account = accounts[account_id];
      addressElement.innerHTML = this.account;
      this.refreshName();
      this.refreshBalance();
      this.refreshCredit();
    }
    else{
      document.getElementById('account-address').innerHTML = "no such an account!";
      const balanceElement = document.getElementById("balance");
      balanceElement.innerHTML = "NAN";
      const creditElement = document.getElementById("credit");
      creditElement.innerHTML = "NAN";
    }
    //console.log('changeAccount');
  },

  //更改当前账户名字
  changeName: async function(){
    const oldName = document.getElementById("name").innerHTML;
    if(oldName == "银行"){
      this.setStatus("Sorry! The bank can't change name!", "status0");
    }
    else{
      const newName = document.getElementById("new-name").value;
      this.setStatus("Changing name... (please wait)", "status0");
      const { setName } = this.meta.methods;
      await setName(newName).send({ from: this.account });
      this.refreshName();
      this.setStatus("Change name completed!", "status0");
      //this.setStatus("Change name succeed!");     
    }
  },
  
  //创建应收账款
  createContract: async function() {
    if(this.account != company){
      this.setStatus("Sorry! You have no right to create a receipt!", "status1");
    }
    else{
      const receiver = document.getElementById("create-receiver").value;
      if(receiver == this.account){
        this.setStatus("Sorry! You can not fill in your own address as receiver!", "status1");
      }
      else{
        const amount = parseInt(document.getElementById("create-amount").value);
        const time = parseInt(document.getElementById("create-repay").value);
        //console.log(amount);
        this.setStatus("Initiating receipt... (please wait)", "status1");

        const { createContract } = this.meta.methods;
        await createContract(receiver, amount, time).send({ from: this.account, gas: 6721975 });
        //await createContract(receiver, amount, time).estimateGas({from: this.account});
        this.setStatus("Create receipt completed!", "status1");
        this.refreshBalance();
        this.refreshCredit();
        //console.log('Create receipt complete!');
      }
    }
  },
  
  //拆分应收账款
  splitReceipt: async function() {
    const receiver = document.getElementById("split-receiver").value;
    if(receiver == this.account){
      this.setStatus("Sorry! You can not fill in your own address as receiver!", "status1");
    }
    else{
      const amount = parseInt(document.getElementById("split-amount").value);
      this.setStatus('Spliting receipt... (please wait)', "status2");
      const { splitReceipt } = this.meta.methods;
      await splitReceipt(receiver, amount).send({ from: this.account,  gas: 6721975  });
      this.refreshBalance();
      this.refreshCredit();
      this.setStatus('Split receipt completed!', "status2");
    }
  },

  //融资
  financing: async function() {
    const oldName = document.getElementById("name").innerHTML;
    if(oldName != "银行"){
      this.setStatus("Sorry! You have no right to call financing function!", "status3");
    }
    else{
      const from = document.getElementById("finance-from").value;
      const receiver = document.getElementById("finance-to").value;
      this.setStatus('Financing... (please wait)', "status3");
      const { financing } = this.meta.methods;
      await financing(from, receiver).send({ from: this.account,  gas: 6721975  });
      this.refreshBalance();
      this.refreshCredit();
      this.setStatus('Financing completed!', "status3");
    }
  },

  //结算
  repay:  async function() {
    if(this.account != company){
      this.setStatus("Sorry! You have no right to call financing function!", "status4");
    }
    else{
      this.setStatus('Repaying... (please wait)', "status4");
      const { repay } = this.meta.methods;
      await repay().send({ from: this.account,  gas: 6721975  });
      this.refreshBalance();
      this.refreshCredit();
      this.setStatus('Repaying completed!', "status4");
    }
  },

  refreshBalance: async function() {
    const { getBalance } = this.meta.methods;
    const balance = await getBalance(this.account).call();
    //console.log(balance);
    const balanceElement = document.getElementById("balance");
    balanceElement.innerHTML = balance;
  },

  refreshCredit: async function() {
    const { getCredit } = this.meta.methods;
    const credit = await getCredit(this.account).call();
    //console.log(credit);
    const creditElement = document.getElementById("credit");
    creditElement.innerHTML = credit;
  },

  refreshName: async function() {
    const { getName } = this.meta.methods;
    const name = await getName(this.account).call();
    //console.log(name);
    const nameElement = document.getElementById("name");
    nameElement.innerHTML = name;
  },

  setStatus: function(message, statusStr) {
    const status = document.getElementById(statusStr);
    status.innerHTML = message;
  },
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }

  App.start();
});
