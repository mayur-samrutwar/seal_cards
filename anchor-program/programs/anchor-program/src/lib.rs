use anchor_lang::prelude::*;

declare_id!("3QjCFdTMsKaQNBgSfntLvf9nAh2nEKZh5xvQGcrkWcDb");

#[program]
pub mod anchor_program {
    use super::*;

    /// Initialize a new data account
    pub fn initialize(ctx: Context<Initialize>, value: u64) -> Result<()> {
        let data_account = &mut ctx.accounts.data_account;
        data_account.value = value;
        data_account.authority = ctx.accounts.authority.key();
        msg!("Initialized with value: {}", value);
        Ok(())
    }

    /// Set a new value
    pub fn set_value(ctx: Context<SetValue>, new_value: u64) -> Result<()> {
        let data_account = &mut ctx.accounts.data_account;
        require!(
            data_account.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        data_account.value = new_value;
        msg!("Value set to: {}", new_value);
        Ok(())
    }

    /// Get the current value (read-only)
    pub fn get_value(ctx: Context<GetValue>) -> Result<u64> {
        let data_account = &ctx.accounts.data_account;
        msg!("Current value: {}", data_account.value);
        Ok(data_account.value)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DataAccount::INIT_SPACE
    )]
    pub data_account: Account<'info, DataAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetValue<'info> {
    #[account(mut, has_one = authority @ ErrorCode::Unauthorized)]
    pub data_account: Account<'info, DataAccount>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetValue<'info> {
    pub data_account: Account<'info, DataAccount>,
}

#[account]
#[derive(InitSpace)]
pub struct DataAccount {
    pub value: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
}
