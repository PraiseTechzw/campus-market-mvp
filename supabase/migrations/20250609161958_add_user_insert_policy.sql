-- Add policy to allow inserting new users
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

-- Add policy to allow service role to insert users (for signup)
CREATE POLICY "Service role can insert users" ON users FOR INSERT TO service_role 
WITH CHECK (true); 