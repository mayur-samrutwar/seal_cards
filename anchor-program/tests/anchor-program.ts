import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

describe("anchor-program", () => {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Use workspace which auto-loads IDL
  const program = anchor.workspace.AnchorProgram as Program<any>;
  
  // Generate a keypair for the data account
  const dataAccount = Keypair.generate();
  const authority = provider.wallet;

  it("Initializes with a value", async () => {
    const initialValue = new anchor.BN(42);

    const tx = await program.methods
      .initialize(initialValue)
      .accounts({
        dataAccount: dataAccount.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([dataAccount])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Fetch the account and check the value
    const account = await program.account.dataAccount.fetch(dataAccount.publicKey) as any;
    expect(account.value.toNumber()).to.equal(42);
    expect(account.authority.toString()).to.equal(authority.publicKey.toString());
  });

  it("Gets the current value", async () => {
    const value = await program.methods
      .getValue()
      .accounts({
        dataAccount: dataAccount.publicKey,
      })
      .view();

    expect(value.toNumber()).to.equal(42);
    console.log("Get value result:", value.toNumber());
  });

  it("Sets a new value", async () => {
    const newValue = new anchor.BN(100);

    const tx = await program.methods
      .setValue(newValue)
      .accounts({
        dataAccount: dataAccount.publicKey,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("Set value transaction signature:", tx);

    // Verify the value was updated
    const account = await program.account.dataAccount.fetch(dataAccount.publicKey) as any;
    expect(account.value.toNumber()).to.equal(100);
  });

  it("Gets the updated value", async () => {
    const value = await program.methods
      .getValue()
      .accounts({
        dataAccount: dataAccount.publicKey,
      })
      .view();

    expect(value.toNumber()).to.equal(100);
    console.log("Get updated value result:", value.toNumber());
  });

  it("Fails to set value with wrong authority", async () => {
    const wrongAuthority = Keypair.generate();
    const newValue = new anchor.BN(200);

    try {
      await program.methods
        .setValue(newValue)
        .accounts({
          dataAccount: dataAccount.publicKey,
          authority: wrongAuthority.publicKey,
        })
        .signers([wrongAuthority])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (err) {
      expect(err.toString()).to.include("Unauthorized");
      console.log("Correctly rejected unauthorized access");
    }
  });
});
