
import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media"
    ADD COLUMN "uploaded_by_id" integer
  `)

  await db.execute(sql`
    ALTER TABLE "media"
    ADD CONSTRAINT "media_uploaded_by_id_users_id_fk"
    FOREIGN KEY ("uploaded_by_id")
    REFERENCES "users" ("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION
  `)

  await db.execute(sql`
    CREATE INDEX "media_uploaded_by_id_idx"
    ON "media" USING btree ("uploaded_by_id")
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "media_uploaded_by_id_idx"
  `)

  await db.execute(sql`
    ALTER TABLE "media"
    DROP CONSTRAINT IF EXISTS "media_uploaded_by_id_users_id_fk"
  `)

  await db.execute(sql`
    ALTER TABLE "media"
    DROP COLUMN IF EXISTS "uploaded_by_id"
  `)
}
