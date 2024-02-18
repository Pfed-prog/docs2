import { ProofsOnlyZkApp } from './ProofsOnlyZkApp.js';
import { SecondaryZkApp } from './SecondaryZkApp.js';

import {
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
} from 'o1js';

(async function main() {

  const proofsEnabled = false;
  const Local = Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  const deployerAccount = Local.testAccounts[0].privateKey;
  const deployerPubkey = deployerAccount.toPublicKey();

  if (proofsEnabled) {
    ProofsOnlyZkApp.compile();
    SecondaryZkApp.compile();
  }

  // ----------------------------------------------------

  const proofsOnlySk = PrivateKey.random();
  const proofsOnlyAddr = proofsOnlySk.toPublicKey();

  const secondarySk = PrivateKey.random();
  const secondaryAddr = secondarySk.toPublicKey();


  const proofsOnlyInstance = new ProofsOnlyZkApp(proofsOnlyAddr);
  const secondaryInstance = new SecondaryZkApp(secondaryAddr);

  // ----------------------------------------------------

  const deploy_txn = await Mina.transaction(deployerPubkey, () => {
    AccountUpdate.fundNewAccount(deployerPubkey, 2);
    proofsOnlyInstance.deploy({ zkappKey: proofsOnlySk });
    secondaryInstance.deploy({ zkappKey: secondarySk });
  });

  await deploy_txn.prove();
  deploy_txn.sign([ deployerAccount, proofsOnlySk, secondarySk ]);

  // await showTxn(deploy_txn, 'deploy_txn', legend);
  // await saveTxn(deploy_txn, 'deploy_txn', legend, './deploy_txn.png');

  await deploy_txn.send();


  console.log('deployed')

  // ----------------------------------------------------

  const txn1 = await Mina.transaction(deployerPubkey, () => {
    proofsOnlyInstance.add(Field(4));
  });

  await txn1.prove();
  txn1.sign([ deployerAccount ]);


  await txn1.send();

  // ----------------------------------------------------

  console.log('tx1')

  const txn2 = await Mina.transaction(deployerPubkey, () => {
    proofsOnlyInstance.callSecondary(secondaryAddr);
  });

  await txn2.prove();
  txn2.sign([ deployerAccount ]);


  await txn2.send();

})();
