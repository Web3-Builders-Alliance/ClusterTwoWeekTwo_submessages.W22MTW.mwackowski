import { SigningCosmWasmClient, Secp256k1HdWallet, GasPrice, Coin } from "cosmwasm";

import * as fs from 'fs';
import axios from 'axios';
import { ClientRequest } from "http";

const rpcEndpoint = "https://rpc.uni.juno.deuslabs.fi";

const manager_wasm = fs.readFileSync("../artifacts/manager.wasm");
const counter_wasm = fs.readFileSync("../artifacts/counter.wasm");

const mnemonic =
    "gym choose gallery tree title mushroom that seat excess rely rebel horror";

const code_manager_id = 2695;
const code_counter_id = 2679;

const manager_contract_address = "juno1rkm6mjnd9a2s6r6z733v8x3pzshj5zcmfhud7seluj2qpl802j2s05q675";
const counter_contract_address = "juno1xajlkmlv6628g26jy4zgxqk68ckhy23k60j2t5gqf53lc2en7hgqpyvl6c";

async function setupClient(mnemonic: string, rpc: string, gas: string | undefined): Promise<SigningCosmWasmClient> {
    if (gas === undefined) {
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno'});
        let client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet);
        return client;
    } else {
        let gas_price = GasPrice.fromString(gas);
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno' });
        let client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet, { gasPrice: gas_price });
        return client;
    }
}

async function getAddress(mnemonic: string, prefix: string = 'juno') {
    let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix });
    let accounts = await wallet.getAccounts();
    return accounts[0].address;
}

describe("Messages Fullstack Test", () => {
    xit("Generate Wallet", async () => {
        let wallet = await Secp256k1HdWallet.generate(12);
        console.log(wallet.mnemonic);
    });

    xit("Get Testnet Tokens", async () => {
        //let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno' });
        //console.log(await wallet.getAccounts());
        console.log(await getAddress(mnemonic));
        try {
            let res = await axios.post("https://faucet.uni.juno.deuslabs.fi/credit", { "denom": "ujunox", "address": await getAddress(mnemonic) });
            console.log(res);
        } catch (e) {
            console.log(e);
        }
    }).timeout(100000);

    xit("Balance Testnet Tokens", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let searchDenom: string = 'ujunox';
        let res = await client.getBalance(await getAddress(mnemonic), "ujunox");
        console.log(res);        
    }).timeout(100000);

    xit("Send Testnet Tokens", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let receiver = "";
        let res = await client.sendTokens(await getAddress(mnemonic), receiver, [{denom:"ujunox", amount:"1000000"}], "auto");
        console.log(res);
    }).timeout(100000);

    //same as
    //junod tx wasm store artifacts/manager.wasm --from wallet --node https://rpc.uni.juno.deuslabs.fi --chain_id=uni-3 --gas-price=0.025ujunox --gas auto
    xit("Upload manager code to testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.upload(await getAddress(mnemonic), manager_wasm, "auto");
        //calculateFee()
        console.log(JSON.stringify(res.logs[0].events));
    }).timeout(100000);

    xit("Upload counter code to testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.upload(await getAddress(mnemonic), counter_wasm, "auto");
        //calculateFee()
        console.log(JSON.stringify(res.logs[0].events));
    }).timeout(100000);

    xit("Instantiate manager code on testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.instantiate(await getAddress(mnemonic), code_manager_id, { }, "messages", "auto");
        console.log(res);
    }).timeout(100000);
    // manager contract addrr: juno1mcl0m3f33g2u250xr9t4kshfjw6ccs34z6pxwqulkmzdc2czwd0s83a09y
    
    xit("Instantiate new counter", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.execute(await getAddress(mnemonic), 
        manager_contract_address, {  instantiate_new_counter: {code_id: code_counter_id}},
        "auto", "", 
        [{amount: "10000", denom: "ujunox"}]);
        console.log(res);

        for (let i = 0; i<res.logs[0].events.length; i++) {
            console.log("------------EVENTS[%s]-----------------",i);
            console.log(res.logs[0].events[i]);          
        }
    }).timeout(20000);
    
    xit("Query all contracts on testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.queryContractSmart(manager_contract_address, { get_contracts : {}});

        for (let i = 0; i<res['contracts'].length; i++) {
            console.log("------------CONTRACTS[%s]-----------------", i);
            console.log(res['contracts'][i]);          
        }
    }).timeout(50000);

    it("Increment", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.execute(await getAddress(mnemonic), 
        manager_contract_address, {  increment: { contract: counter_contract_address}},
        "auto", "", 
        [{amount: "10000", denom: "ujunox"}]);
        console.log(res);
    }).timeout(20000);


});