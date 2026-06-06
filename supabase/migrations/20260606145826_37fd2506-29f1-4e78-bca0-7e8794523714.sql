CREATE TABLE public.heart_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL,
  findings TEXT,
  recommendations TEXT,
  duration_seconds INTEGER,
  audio_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.heart_analyses TO authenticated;
GRANT ALL ON public.heart_analyses TO service_role;

ALTER TABLE public.heart_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own heart analyses" ON public.heart_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own heart analyses" ON public.heart_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own heart analyses" ON public.heart_analyses
  FOR DELETE USING (auth.uid() = user_id);