-- AlterTable: add discord_bot_token_enc column
ALTER TABLE "user_credentials" ADD COLUMN "discord_bot_token_enc" TEXT;
