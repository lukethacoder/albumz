ALTER TABLE "navidrome_config" RENAME TO "user_config";--> statement-breakpoint
ALTER TABLE "user_config" RENAME COLUMN "url" TO "navidrome_url";--> statement-breakpoint
ALTER TABLE "user_config" RENAME COLUMN "username" TO "navidrome_username";--> statement-breakpoint
ALTER TABLE "user_config" RENAME COLUMN "password" TO "navidrome_password";--> statement-breakpoint
ALTER TABLE "user_config" DROP CONSTRAINT "navidrome_config_user_id_unique";--> statement-breakpoint
ALTER TABLE "user_config" DROP CONSTRAINT "navidrome_config_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_config" ADD COLUMN "enabled_external_services" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_config" ADD CONSTRAINT "user_config_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_config" ADD CONSTRAINT "user_config_user_id_unique" UNIQUE("user_id");