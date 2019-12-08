pragma solidity >=0.4.21 <0.6.0;
//pragma experimental ABIEncoderV2;

contract SupplyChain{
    
    //声明一份应收账款
    struct Receipt {
        uint id;                //收据编号
    	address from;           //欠款人
    	address to;             //收款人
    	uint mount;             //金额
    	uint createDate;        //创建日期
    	uint deadLine;          //还钱日期
    	bool isRepay;           //是否已经还钱了
    	bool isFinancing;       //是否已经向银行融资
    }
    
    uint public index;                          //当前应收账款数
    address public coreCompany;                 //核心公司(车企)
    address private bankCompany;                //银行的地址
    mapping(address => string)public names;     //公司名
    mapping(address => uint)public balances;    //公司的现金
    mapping(address => int32)public credit;     //公司的信用(所有应收账款里对应自己的应收和欠款总额，只有核心公司能为负数)
    Receipt[] public receipts;                  //存储所有应收账款
    event Createcontract(string comment, uint receipt_NO, address from, address to);
    event Split(uint original_receipt, string comment1, string comment2, uint new_receipt, address from, address to);
    event Financing(string comment, address bank, address to, uint amount);
    event Repay(string comment, uint receipt_NO);
    
    constructor() public {
        //核心公司赋值为合约部署者
        coreCompany = msg.sender;
        //指定银行账户
        bankCompany = 0x3B8c80Ae60f5D6699B8E6fe90B63525905F7B0A3;
        //初始化银行和核心公司余额
        balances[bankCompany] = 2147483647;
        balances[coreCompany] = 200000000;
        names[coreCompany] = "核心公司";
        names[bankCompany] = "银行";
        //初始化应收账款数
        index = 0;
    }
    
    //创建应收账款函数
    //参数：receiver为收款人地址，amount为交易金额，timeToRepay为应收账款有效时间（“天”为单位）
    function createContract(address receiver, uint amount, uint timeToRepay)public {
        //验证是否是核心企业创建应收账款
        if(msg.sender == coreCompany){
            //计算还款时间
            uint timeTemp = now + timeToRepay * 1 days;
            //新建一份应收账款
            
            receipts.push(Receipt({
                id: index,
                from: msg.sender,
                to: receiver,
                mount: amount,
                createDate: now,
                deadLine: timeTemp,
                isRepay:false,
                isFinancing:false
            }));
            
            index ++;
            //balances[msg.sender] -= amount;
            credit[msg.sender] -= int32(amount);
            credit[receiver] += int32(amount);
            emit Createcontract("合约创建成功! ", index, msg.sender, receiver);
        }
        //不是核心企业
        else{
            revert("Sorry! You have no right to create a receipt!");
        }
    }
    
    //拆分应收账款函数
    //参数：receiver为拆分给下一级公司的地址，amount为拆分金额
    function splitReceipt(address receiver, uint amount)public{
        if(receiver == msg.sender){
            revert("Sorry! You can not fill in your own address as receiver!");
        }
        uint tempIndex = 0;
        //遍历找到属于自己要收钱的应收账款
        for(uint i = 0; i < receipts.length; i ++){
            //此应收账款收到的钱要大于等于准备拆分的钱, 且没结算，没融资
            if(receipts[i].to == msg.sender && receipts[i].mount >= amount && receipts[i].isRepay == false && receipts[i].isFinancing == false){
                //更改原本的应收账款
                tempIndex = i;
                receipts[i].mount -= amount;
                credit[msg.sender] -= int32(amount);
                //创建新的应收账款
                receipts.push(Receipt({
                    id: index,
                    from: receipts[i].from,
                    to: receiver,
                    mount: amount,
                    createDate: now,
                    deadLine: receipts[i].deadLine,
                    isRepay:false,
                    isFinancing:false
                }));
                emit Split(tempIndex, "原本收据拆分成功", "新收据创建成功", index, receipts[i].from, receiver);
                index ++;
                credit[receiver] += int32(amount);
            }
        }
    }
    

    
    //融资函数(将应收账款给银行,自己拿到现金)
    //参数：from为应收账款中欠款人的地址，to为应收账款中收款人的地址
    function financing(address from, address to)public{
        //只能由银行调用
        if(msg.sender != bankCompany){
            revert("Sorry! You have no right to call financing function!");
        }
        else{
            //遍历所有的应收账款
            for(uint i = 0; i < receipts.length; i ++){
                if(receipts[i].from == from && receipts[i].to == to && receipts[i].isRepay == false && receipts[i].isFinancing == false){
                    receipts[i].to = bankCompany;
                    receipts[i].isFinancing == true;
                    credit[to] -= int32(receipts[i].mount);
                    credit[bankCompany] += int32(receipts[i].mount);
                    balances[to] += receipts[i].mount;
                    balances[bankCompany] -= receipts[i].mount;
                    emit Financing("融资成功", bankCompany, msg.sender, receipts[i].mount);
                }
            }
        }
    }
    
    //结算
    function repay()public{
        //只能由核心公司调用
        if(msg.sender == coreCompany){
            for(uint i = 0; i < receipts.length; i ++){
                //当前日期大于还款日期，执行还款
                //if(now >= receipts[i].deadLine){
                    //判断是否已经还款
                    if(receipts[i].isRepay == false){
                        balances[receipts[i].to] += receipts[i].mount;
                        credit[receipts[i].to] -= int32(receipts[i].mount);
                        balances[receipts[i].from] -= receipts[i].mount;
                        credit[receipts[i].from] += int32(receipts[i].mount);
                        receipts[i].isRepay = true;
                        emit Repay( "还款成功", receipts[i].id);
                    }
                //}
            }
        }
        else{
            revert("Sorry! You have no right to call repay function!");
        }
    }

    function getCredit(address addr) public view returns(int) {
        return credit[addr];
    }

    function getBalance(address addr) public view returns(uint) {
        return balances[addr];
    }

    function setName(string memory name2) public{
        if(msg.sender == bankCompany){
            revert("Sorry! The bank can't change name!");
        }
        names[msg.sender] = name2;
    }

    function getName(address addr) public view returns(string memory) {
        return names[addr];
    }

}