const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

const main = async() => {
  console.log("🚀 Starting test...")

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Myepicproject;

  const gif1 = anchor.web3.Keypair.generate();
  const gif2 = anchor.web3.Keypair.generate();
  const gif3 = anchor.web3.Keypair.generate();

  console.log("🚗🚗🚗 Airdropping user1 some Solana...")
  const user1 = anchor.web3.Keypair.generate();
  const signature = await program.provider.connection.requestAirdrop(user1.publicKey, 1000000000);
  await program.provider.connection.confirmTransaction(signature);
  console.log("🚗🚗🚗 Airdrop done!..");

  // START OF TEST

  await program.rpc.addGif("testing 1", {
    accounts: {
      gif: gif1.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [gif1],
  });

  let account = await program.account.gif.fetch(gif1.publicKey);
  console.log("🚗🚗🚗 GIF account 1: ", account);

  await program.rpc.addGif("testing 2", {
    accounts: {
      gif: gif2.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [gif2],
  });

  account = await program.account.gif.fetch(gif2.publicKey);
  console.log("🚗🚗🚗 GIF account 2: ", account);

  await program.rpc.addGif("testing 3", {
    accounts: {
      gif: gif3.publicKey,
      user: user1.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [user1, gif3],
  });

  account = await program.account.gif.fetch(gif3.publicKey);
  console.log("🚗🚗🚗 GIF account 3: ", account);

  let accounts = await program.account.gif.all();
  console.log("🚗🚗🚗 Accounts variable isArray? :  ", Array.isArray(accounts));
  console.log("🚗🚗🚗 ALL Accounts: ", accounts);
  console.log("🚗🚗🚗 Length of ALL Accounts:", accounts.length);

  await program.rpc.likeGif({
    accounts: {
      gif: accounts[0].publicKey,
      user: user1.publicKey,
    },
    signers: [user1],
  });

  account = await program.account.gif.fetch(accounts[0].publicKey);
  console.log("🚗🚗🚗 GIF account 1 liked by user1: ", account);

  await program.rpc.likeGif({
    accounts: {
      gif: accounts[0].publicKey,
      user: provider.wallet.publicKey,
    },
    signers: [],
  });

  account = await program.account.gif.fetch(accounts[0].publicKey);
  console.log("🚗🚗🚗 GIF account 1 liked by user1 and provider wallet: ", account);

  await program.rpc.likeGif({
    accounts: {
      gif: accounts[0].publicKey,
      user: provider.wallet.publicKey,
    },
    signers: [],
  });

  account = await program.account.gif.fetch(accounts[0].publicKey);
  console.log("🚗🚗🚗 GIF account 1 liked by user1 and unliked by provider wallet: ", account);

  await program.rpc.commentGif("Hello. How are you?", {
    accounts: {
      gif: accounts[1].publicKey,
      user: user1.publicKey,
    },
    signers: [user1],
  });

  account = await program.account.gif.fetch(accounts[1].publicKey);
  console.log("🚗🚗🚗 GIF account 2 commented by user1: ", account);

  await program.rpc.commentGif("I am good, thanks!", {
    accounts: {
      gif: accounts[1].publicKey,
      user: provider.wallet.publicKey,
    },
    signers: [],
  });

  account = await program.account.gif.fetch(accounts[1].publicKey);
  console.log("🚗🚗🚗 GIF account 2 commented by provider wallet: ", account);

  accounts = await program.account.gif.all();
  console.log("🚗🚗🚗 Accounts variable isArray? :  ", Array.isArray(accounts));
  console.log("🚗🚗🚗 ALL Accounts: ", accounts);
  console.log("🚗🚗🚗 Length of ALL Accounts:", accounts.length);

  console.log("🚗🚗🚗 Testing tipping feature...:");
  let balance = await program.provider.connection.getBalance(provider.wallet.publicKey);
  console.log("🚗🚗🚗 Provider wallet balance: ", balance);
  balance = await program.provider.connection.getBalance(user1.publicKey);
  console.log("🚗🚗🚗 User1 wallet balance: ", balance);

  await program.rpc.tipGif({
    accounts: {
      gif: accounts[0].publicKey,
      from: user1.publicKey,
      to: accounts[0].account.user,
      systemProgram: SystemProgram.programId,
    },
    signers: [user1],
  });

  balance = await program.provider.connection.getBalance(provider.wallet.publicKey);
  console.log("🚗🚗🚗 Provider wallet balance: ", balance);
  balance = await program.provider.connection.getBalance(user1.publicKey);
  console.log("🚗🚗🚗 User1 wallet balance: ", balance);
  account = await program.account.gif.fetch(accounts[0].publicKey);
  console.log("🚗🚗🚗 GIF account 1 after tipping: ", account);

  console.log("🚗🚗🚗 Airdropping user2 some Solana... (0.035 SOL)")
  const user2 = anchor.web3.Keypair.generate();
  const signature2 = await program.provider.connection.requestAirdrop(user2.publicKey, 35000000);
  await program.provider.connection.confirmTransaction(signature2);
  console.log("🚗🚗🚗 Airdrop done!..");

  balance = await program.provider.connection.getBalance(user1.publicKey);
  console.log("🚗🚗🚗 User1 wallet balance: ", balance);
  balance = await program.provider.connection.getBalance(user2.publicKey);
  console.log("🚗🚗🚗 User2 wallet balance: ", balance);
  account = await program.account.gif.fetch(accounts[2].publicKey);

  await program.rpc.tipGif({
    accounts: {
      gif: accounts[2].publicKey,
      from: user2.publicKey,
      to: accounts[2].account.user,
      systemProgram: SystemProgram.programId,
    },
    signers: [user2],
  });

  balance = await program.provider.connection.getBalance(user1.publicKey);
  console.log("🚗🚗🚗 User1 wallet balance: ", balance);
  balance = await program.provider.connection.getBalance(user2.publicKey);
  console.log("🚗🚗🚗 User2 wallet balance: ", balance);
  account = await program.account.gif.fetch(accounts[2].publicKey);
  console.log("🚗🚗🚗 GIF account 3 after tipping: ", account);

  console.log("🚗🚗🚗 Below should return an error as user2 does not have enough solana");
  try {
    await program.rpc.tipGif({
      accounts: {
        gif: accounts[2].publicKey,
        from: user2.publicKey,
        to: accounts[2].account.user,
        systemProgram: SystemProgram.programId,
      },
      signers: [user2],
    });
  } catch(err) {
    console.log("Here is the error: ", err.message);
  }

  console.log("🚗🚗🚗 Deleting accounts... ");

  console.log("🚗🚗🚗 Deleting FIRST ACCOUNT... ");
  await program.rpc.deleteGif({
    accounts: {
      gif: gif1.publicKey,
      user: provider.wallet.publicKey,
    },
    signers: [],
  });

  console.log("🚗🚗🚗 Deleting SECOND ACCOUNT... ");
  await program.rpc.deleteGif({
    accounts: {
      gif: gif2.publicKey,
      user: provider.wallet.publicKey,
    },
    signers: [],
  });

  console.log("🚗🚗🚗 Deleting THIRD ACCOUNT... ");
  await program.rpc.deleteGif({
    accounts: {
      gif: gif3.publicKey,
      user: user1.publicKey,
    },
    signers: [user1],
  });

  accounts = await program.account.gif.all();
  console.log("🚗🚗🚗 Accounts variable isArray? :  ", Array.isArray(accounts));
  console.log("🚗🚗🚗 ALL Accounts: ", accounts);
  console.log("🚗🚗🚗 Length of ALL Accounts:", accounts.length);

  console.log("🚗🚗🚗 Test is Done!!!")

  // END OF TEST

  // DELETE ALL ACCOUNTS

  // let accounts = await program.account.gif.all();
  // console.log("🚗🚗🚗 Accounts variable isArray? :  ", Array.isArray(accounts));
  // console.log("🚗🚗🚗 ALL Accounts: ", accounts);
  // console.log("🚗🚗🚗 Length of ALL Accounts:", accounts.length);

  // for (var i = 0; i < accounts.length; i++) {
  //   await program.rpc.deleteGifs({
  //     accounts: {
  //       gif: accounts[i].publicKey,
  //       user: provider.wallet.publicKey,
  //     },
  //     signers: [],
  //   });
  // }

  // accounts = await program.account.gif.all();
  // console.log("🚗🚗🚗 Accounts variable isArray? :  ", Array.isArray(accounts));
  // console.log("🚗🚗🚗 ALL Accounts: ", accounts);
  // console.log("🚗🚗🚗 Length of ALL Accounts:", accounts.length);

  // END DELETE ALL ACCOUNTS
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();