use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("8Fyzw4RT9efF9VpqHvazHRPnfohhviX5VmtUmQN4ATxw");

#[program]
pub mod myepicproject {
  use super::*;
  
  pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
    let gif = &mut ctx.accounts.gif;
    let user = &ctx.accounts.user;
    let clock = Clock::get().unwrap();

    gif.gif_link = gif_link.to_string();
    gif.user = *user.key;
    gif.timestamp = clock.unix_timestamp;
		
    Ok(())
  }

  pub fn like_gif(ctx: Context<LikeGif>) -> ProgramResult {
    let likes = &mut ctx.accounts.gif.likes;
    let user = &ctx.accounts.user;
    
    if likes.iter_mut().any(|x| *x == *user.key) {
      likes.retain(|x| *x != *user.key)
    } else {
      likes.push(*user.key);
    }

    Ok(())
  }

  pub fn comment_gif(ctx: Context<CommentGif>, gif_comment: String) -> ProgramResult {
    let comments = &mut ctx.accounts.gif.comments;
    let user = &ctx.accounts.user;
    let clock = Clock::get().unwrap();
    
    let comment = CommentStruct {
      user: *user.key,
      comment: gif_comment.to_string(),
      timestamp: clock.unix_timestamp,
    };

    comments.push(comment);

    Ok(())
  }

  pub fn delete_gif(_ctx: Context<DeleteGif>) -> ProgramResult {
    Ok(())
  }

  // FOR TESTING ONLY:

  // pub fn delete_gifs(_ctx: Context<DeleteGifs>) -> ProgramResult {
  //   Ok(())
  // }
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CommentStruct {
  pub user: Pubkey,
  pub comment: String,
  pub timestamp: i64,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
  #[account(init, payer = user, space = 10000)]
  pub gif: Account<'info, Gif>,
  #[account(mut)]
  pub user: Signer<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct LikeGif<'info> {
  #[account(mut)]
  pub gif: Account<'info, Gif>,
  pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct CommentGif<'info> {
  #[account(mut)]
  pub gif: Account<'info, Gif>,
  pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct TipGif<'info> {
  #[account(mut)]
  pub gif: Account<'info, Gif>,
  pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteGif<'info> {
  #[account(mut, has_one = user, close = user)]
  pub gif: Account<'info, Gif>,
  #[account(mut)]
  pub user: Signer<'info>,
}

// FOR TESTING ONLY:

// #[derive(Accounts)]
// pub struct DeleteGifs<'info> {
//   #[account(mut, close = user)]
//   pub gif: Account<'info, Gif>,
//   #[account(mut)]
//   pub user: Signer<'info>,
// }

#[account]
pub struct Gif {
  pub gif_link: String,
  pub user: Pubkey,
  pub timestamp: i64,
  pub likes: Vec<Pubkey>,
  pub comments: Vec<CommentStruct>,
  pub tips: u64,
}