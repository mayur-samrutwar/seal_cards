import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

describe("native-solana-program", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const connection = provider.connection;
  const payer = provider.wallet as anchor.Wallet;

  // Generate keypair for the data account
  const dataAccount = Keypair.generate();
  const dataAccountPubkey = dataAccount.publicKey;

  // Program ID (will be set after deployment)
  let programId: PublicKey;

  before(async () => {
    // Load the program ID from the deployed program
    // For now, we'll use a placeholder - replace with actual program ID after deployment
    const programKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(
        path.join(__dirname, "../target/deploy/native_solana_program-keypair.json"),
        "utf-8"
      )))
    );
    programId = programKeypair.publicKey;
  });

  it("Initializes the data account", async () => {
    const initialValue = 42;

    // Create instruction data: [instruction: u8, value: u64]
    const instructionData = Buffer.alloc(9);
    instructionData.writeUInt8(0, 0); // Initialize instruction
    instructionData.writeBigUInt64LE(BigInt(initialValue), 1, true); // Little-endian

    const transaction = new anchor.web3.Transaction().add({
      keys: [
        { pubkey: dataAccountPubkey, isSigner: true, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: programId,
      data: instructionData,
    });

    // Create and fund the account
    const lamports = await connection.getMinimumBalanceForRentExemption(40);
    transaction.add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: dataAccountPubkey,
        space: 40,
        lamports,
        programId,
      })
    );

    const signature = await anchor.web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [payer.payer as Keypair, dataAccount],
      { commitment: "confirmed" }
    );

    console.log("Initialize transaction signature:", signature);
  });

  it("Gets the current value", async () => {
    // Create instruction data: [instruction: u8]
    const instructionData = Buffer.alloc(1);
    instructionData.writeUInt8(2, 0); // Get value instruction

    const transaction = new anchor.web3.Transaction().add({
      keys: [
        { pubkey: dataAccountPubkey, isSigner: false, isWritable: false },
      ],
      programId: programId,
      data: instructionData,
    });

    const signature = await anchor.web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [payer.payer as Keypair],
      { commitment: "confirmed" }
    );

    console.log("Get value transaction signature:", signature);
  });

  it("Sets a new value", async () => {
    const newValue = 100;

    // Create instruction data: [instruction: u8, value: u64]
    const instructionData = Buffer.alloc(9);
    instructionData.writeUInt8(1, 0); // Set value instruction
    instructionData.writeBigUInt64LE(BigInt(newValue), 1, true);

    const transaction = new anchor.web3.Transaction().add({
      keys: [
        { pubkey: dataAccountPubkey, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ],
      programId: programId,
      data: instructionData,
    });

    const signature = await anchor.web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [payer.payer as Keypair],
      { commitment: "confirmed" }
    );

    console.log("Set value transaction signature:", signature);
  });
});
