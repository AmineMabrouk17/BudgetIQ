-- Sync profile when a user's email or metadata changes
-- (e.g. a Google identity linked to an existing email/password account)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email
       OR NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES (
            NEW.id,
            COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_update();
