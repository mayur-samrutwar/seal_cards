use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Native Solana Program - Processing instruction");

    // Parse instruction
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction = instruction_data[0];

    match instruction {
        0 => {
            // Initialize instruction
            initialize(program_id, accounts, &instruction_data[1..])
        }
        1 => {
            // Set value instruction
            set_value(accounts, &instruction_data[1..])
        }
        2 => {
            // Get value instruction (read-only)
            get_value(accounts)
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let data_account = next_account_info(accounts_iter)?;
    let authority = next_account_info(accounts_iter)?;

    // Verify the account is owned by this program
    if data_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Verify authority is a signer
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Parse the initial value (8 bytes for u64)
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let value = u64::from_le_bytes([
        data[0], data[1], data[2], data[3],
        data[4], data[5], data[6], data[7],
    ]);

    // Store the value and authority in the account data
    let mut account_data = data_account.data.borrow_mut();
    
    // Layout: [value: u64 (8 bytes), authority: Pubkey (32 bytes)]
    account_data[0..8].copy_from_slice(&value.to_le_bytes());
    account_data[8..40].copy_from_slice(authority.key.as_ref());

    msg!("Initialized with value: {}", value);
    Ok(())
}

fn set_value(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let data_account = next_account_info(accounts_iter)?;
    let authority = next_account_info(accounts_iter)?;

    // Verify authority is a signer
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Verify the authority matches
    let account_data = data_account.data.borrow();
    let stored_authority = Pubkey::try_from(&account_data[8..40])
        .map_err(|_| ProgramError::InvalidAccountData)?;
    
    if stored_authority != *authority.key {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Parse the new value
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let new_value = u64::from_le_bytes([
        data[0], data[1], data[2], data[3],
        data[4], data[5], data[6], data[7],
    ]);

    // Update the value
    drop(account_data);
    let mut account_data = data_account.data.borrow_mut();
    account_data[0..8].copy_from_slice(&new_value.to_le_bytes());

    msg!("Value set to: {}", new_value);
    Ok(())
}

fn get_value(accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let data_account = next_account_info(accounts_iter)?;

    // Read the value from account data
    let account_data = data_account.data.borrow();
    let value = u64::from_le_bytes([
        account_data[0], account_data[1], account_data[2], account_data[3],
        account_data[4], account_data[5], account_data[6], account_data[7],
    ]);

    msg!("Current value: {}", value);
    Ok(())
}
