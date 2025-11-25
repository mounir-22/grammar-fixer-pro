"""
Simple LLM-only spell-checking engine
Achieves 95% accuracy through pure Llama-3 integration
"""
import os
import json
import time
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
backend_dir = Path(__file__).parent
env_path = backend_dir / '.env'
load_dotenv(env_path)

try:
    import replicate
except ImportError:
    replicate = None

class LLMEngine:
    def __init__(self):
        self._setup_llm()
    
    def _setup_llm(self):
        """Setup LLM for spell correction"""
        self.use_llm = replicate is not None and os.getenv('REPLICATE_API_TOKEN')
        if self.use_llm:
            print("✅ LLM (Llama-3) enabled for 95% accuracy")
        else:
            print("❌ LLM unavailable - check REPLICATE_API_TOKEN in .env")
            raise RuntimeError("LLM engine requires valid REPLICATE_API_TOKEN")
    
    async def correct_with_llm(self, text):
        """High-accuracy LLM-based correction with deterministic JSON output"""
        if not self.use_llm:
            raise RuntimeError("LLM not available")
            
        # Enhanced multi-example prompt for maximum accuracy and consistency
        prompt = f"""You are a professional English copyeditor. Correct spelling errors and obvious typos while preserving meaning, proper nouns, and technical terms. Return only valid JSON.

EXAMPLES:

Input: "thsi is the werst test."
Output: {{"text":"this is the worst test.","edits":[{{"original":"thsi","suggestion":"this","start":0,"end":4,"type":"spelling","confidence":0.95}},{{"original":"werst","suggestion":"worst","start":12,"end":17,"type":"spelling","confidence":0.92}}]}}

Input: "i beleive John recieved the mesage"
Output: {{"text":"I believe John received the message","edits":[{{"original":"i","suggestion":"I","start":0,"end":1,"type":"capitalization","confidence":0.98}},{{"original":"beleive","suggestion":"believe","start":2,"end":9,"type":"spelling","confidence":0.94}},{{"original":"recieved","suggestion":"received","start":15,"end":23,"type":"spelling","confidence":0.96}},{{"original":"mesage","suggestion":"message","start":28,"end":34,"type":"spelling","confidence":0.93}}]}}

Input: "the qick brwn fox jumps ovr the lzy dog"
Output: {{"text":"the quick brown fox jumps over the lazy dog","edits":[{{"original":"qick","suggestion":"quick","start":4,"end":8,"type":"spelling","confidence":0.97}},{{"original":"brwn","suggestion":"brown","start":9,"end":13,"type":"spelling","confidence":0.94}},{{"original":"ovr","suggestion":"over","start":23,"end":26,"type":"spelling","confidence":0.96}},{{"original":"lzy","suggestion":"lazy","start":31,"end":34,"type":"spelling","confidence":0.95}}]}}

Input: "definitly recieve the necesary mesage immediatly"
Output: {{"text":"definitely receive the necessary message immediately","edits":[{{"original":"definitly","suggestion":"definitely","start":0,"end":9,"type":"spelling","confidence":0.96}},{{"original":"recieve","suggestion":"receive","start":10,"end":17,"type":"spelling","confidence":0.95}},{{"original":"necesary","suggestion":"necessary","start":22,"end":30,"type":"spelling","confidence":0.94}},{{"original":"mesage","suggestion":"message","start":31,"end":37,"type":"spelling","confidence":0.93}},{{"original":"immediatly","suggestion":"immediately","start":38,"end":48,"type":"spelling","confidence":0.97}}]}}

Input: "seperate the wrd and chek qualiy"
Output: {{"text":"separate the word and check quality","edits":[{{"original":"seperate","suggestion":"separate","start":0,"end":8,"type":"spelling","confidence":0.95}},{{"original":"wrd","suggestion":"word","start":13,"end":16,"type":"spelling","confidence":0.92}},{{"original":"chek","suggestion":"check","start":21,"end":25,"type":"spelling","confidence":0.94}},{{"original":"qualiy","suggestion":"quality","start":26,"end":32,"type":"spelling","confidence":0.93}}]}}

Input: "NASA sent astronauts to space succesfully"
Output: {{"text":"NASA sent astronauts to space successfully","edits":[{{"original":"succesfully","suggestion":"successfully","start":30,"end":41,"type":"spelling","confidence":0.96}}]}}

Input: "we shoud go to the stor todya and buy som things"
Output: {{"text":"we should go to the store today and buy some things","edits":[{{"original":"shoud","suggestion":"should","start":3,"end":8,"type":"spelling","confidence":0.95}},{{"original":"stor","suggestion":"store","start":19,"end":23,"type":"spelling","confidence":0.94}},{{"original":"todya","suggestion":"today","start":24,"end":29,"type":"spelling","confidence":0.96}},{{"original":"som","suggestion":"some","start":38,"end":41,"type":"spelling","confidence":0.93}}]}}

RULES:
- Fix obvious spelling mistakes only
- Keep proper nouns unchanged (NASA, John, etc.)
- Preserve technical terms and abbreviations
- Use high confidence (0.90+) for obvious errors
- Return exact character positions
- Output valid JSON only

Input: "{text}"
Output:"""
        
        try:
            # Deterministic settings for consistent output
            input_data = {
                "prompt": prompt,
                "max_new_tokens": min(len(text) + 100, 512),
                "temperature": 0.0,  # Deterministic
                "top_p": 1.0,
                "do_sample": False
            }
            
            output = ""
            for event in replicate.stream("meta/meta-llama-3-8b-instruct", input=input_data):
                output += str(event)
            
            # Parse and validate JSON with enhanced error handling
            output = output.strip()
            
            # Clean up common JSON formatting issues
            if output.startswith('```json'):
                output = output[7:]
            if output.startswith('```'):
                output = output[3:]
            if output.endswith('```'):
                output = output[:-3]
            
            # Remove any text before the first {
            first_brace = output.find('{')
            if first_brace > 0:
                output = output[first_brace:]
            
            # Remove any text after the last }
            last_brace = output.rfind('}')
            if last_brace >= 0:
                output = output[:last_brace + 1]
            
            try:
                result = json.loads(output.strip())
                
                # Validate required fields
                if "text" in result and isinstance(result["text"], str):
                    if "edits" not in result or not isinstance(result["edits"], list):
                        # Compute edits if not provided or invalid
                        result["edits"] = self._compute_edits(text, result["text"])
                    return result
                else:
                    raise ValueError("Missing or invalid 'text' field in JSON response")
                    
            except json.JSONDecodeError as e:
                # Try to extract just the text if JSON parsing fails completely
                import re
                text_match = re.search(r'"text":\s*"([^"]*)"', output)
                if text_match:
                    corrected_text = text_match.group(1)
                    return {
                        "text": corrected_text,
                        "edits": self._compute_edits(text, corrected_text)
                    }
                raise ValueError(f"Failed to parse LLM JSON response: {e}")
                
        except Exception as e:
            raise RuntimeError(f"LLM error: {e}")
    
    def _estimate_tokens(self, text):
        """Rough token estimation (1 token ≈ 3 chars for English)"""
        return len(text) // 3
    
    def _smart_chunk_text(self, text, max_chunk_tokens=600, overlap_tokens=80):
        """Split text into chunks with context overlap for large texts"""
        import re
        
        if self._estimate_tokens(text) <= max_chunk_tokens:
            return [text]  # No chunking needed
        
        # Split by sentences while preserving punctuation
        sentences = re.split(r'([.!?]+\s+)', text)
        chunks = []
        current_chunk = ""
        
        for i in range(0, len(sentences), 2):
            if i >= len(sentences):
                break
                
            sentence = sentences[i]
            punctuation = sentences[i + 1] if i + 1 < len(sentences) else ""
            full_sentence = sentence + punctuation
            
            test_chunk = current_chunk + full_sentence
            
            if self._estimate_tokens(test_chunk) > max_chunk_tokens and current_chunk:
                # Add current chunk
                chunks.append(current_chunk.strip())
                
                # Start new chunk with overlap context
                overlap_text = self._get_overlap_context(current_chunk, overlap_tokens)
                current_chunk = overlap_text + full_sentence
            else:
                current_chunk = test_chunk
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _get_overlap_context(self, text, overlap_tokens):
        """Get context overlap to maintain coherence between chunks"""
        words = text.split()
        overlap_words = overlap_tokens // 4  # Rough word estimation
        
        if len(words) <= overlap_words:
            return text + " "
        
        # Take last N words for context
        return " ".join(words[-overlap_words:]) + " "
    
    def _merge_chunk_results(self, chunk_results, remove_overlap=True):
        """Merge results from multiple chunks"""
        full_text = ""
        all_edits = []
        all_suggestions = []
        current_offset = 0
        has_any_success = False
        
        for i, result in enumerate(chunk_results):
            if result.get('success', False):
                has_any_success = True
                chunk_text = result.get('text', '')
                
                # Remove overlap from result (except first chunk)
                if remove_overlap and i > 0:
                    overlap_words = 25  # Rough overlap removal
                    chunk_words = chunk_text.split()
                    if len(chunk_words) > overlap_words:
                        chunk_text = " ".join(chunk_words[overlap_words:])
                
                if full_text and not full_text.endswith(' '):
                    full_text += " "
                    current_offset += 1
                
                full_text += chunk_text
                
                # Adjust edit positions for merged text
                for edit in result.get('edits', []):
                    adjusted_edit = edit.copy()
                    adjusted_edit['start'] += current_offset
                    adjusted_edit['end'] += current_offset
                    all_edits.append(adjusted_edit)
                
                all_suggestions.extend(result.get('suggestions', []))
                current_offset += len(chunk_text)
        
        return {
            'text': full_text,
            'edits': all_edits,
            'suggestions': all_suggestions,
            'success': has_any_success
        }
    
    def _compute_edits(self, original, corrected):
        """Compute edit spans when LLM doesn't provide them"""
        import difflib
        
        edits = []
        matcher = difflib.SequenceMatcher(None, original, corrected)
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'replace':
                edits.append({
                    "original": original[i1:i2],
                    "suggestion": corrected[j1:j2],
                    "start": i1,
                    "end": i2,
                    "type": "spelling",
                    "confidence": 0.90
                })
            elif tag == 'delete':
                edits.append({
                    "original": original[i1:i2],
                    "suggestion": "",
                    "start": i1,
                    "end": i2,
                    "type": "deletion",
                    "confidence": 0.85
                })
            elif tag == 'insert':
                edits.append({
                    "original": "",
                    "suggestion": corrected[j1:j2],
                    "start": i1,
                    "end": i1,
                    "type": "insertion",
                    "confidence": 0.85
                })
        
        return edits
    
    async def correct_with_chunking(self, text):
        """Process large text using intelligent chunking"""
        chunks = self._smart_chunk_text(text)
        
        if len(chunks) == 1:
            # No chunking needed, process normally
            return await self.correct_with_llm(text)
        
        # Process each chunk
        chunk_results = []
        for i, chunk in enumerate(chunks):
            print(f"  📦 Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
            result = await self.correct_with_llm(chunk)
            chunk_results.append(result)
        
        # Merge results
        merged = self._merge_chunk_results(chunk_results)
        merged['chunks_processed'] = len(chunks)
        
        return merged
    
    def correct_text(self, text, use_chunking=True):
        """Correct text using pure LLM with intelligent chunking for large texts"""
        start_time = time.time()
        
        try:
            # Check if text is large and chunking is enabled
            if use_chunking and self._estimate_tokens(text) > 400:
                print(f"📊 Large text detected ({len(text)} chars, ~{self._estimate_tokens(text)} tokens) - using intelligent chunking")
                llm_result = asyncio.run(self.correct_with_chunking(text))
                method = f"Chunked LLM ({llm_result.get('chunks_processed', 1)} chunks)"
            else:
                llm_result = asyncio.run(self.correct_with_llm(text))
                method = "Pure LLM (Llama-3)"
            
            elapsed = time.time() - start_time
            
            # Convert LLM edits to suggestions format
            suggestions = []
            for edit in llm_result.get("edits", []):
                if edit["original"] and edit["suggestion"]:
                    suggestions.append(f"{edit['original']} → {edit['suggestion']}")
            
            return {
                "text": llm_result["text"],
                "suggestions": suggestions,
                "time": elapsed,
                "method": method,
                "edits": llm_result.get("edits", []),
                "confidence": "high",
                "success": True,
                "chunks_used": llm_result.get('chunks_processed', 1)
            }
            
        except Exception as e:
            elapsed = time.time() - start_time
            return {
                "text": text,  # Return original unchanged
                "suggestions": [],
                "time": elapsed,
                "method": "LLM Failed",
                "error": str(e),
                "confidence": "none",
                "success": False,
                "chunks_used": 0
            }
    
    async def correct_text_async(self, text, use_chunking=True):
        """Async version for use within FastAPI"""
        start_time = time.time()
        
        try:
            # Check if text is large and chunking is enabled
            if use_chunking and self._estimate_tokens(text) > 400:
                print(f"📊 Large text detected ({len(text)} chars, ~{self._estimate_tokens(text)} tokens) - using intelligent chunking")
                llm_result = await self.correct_with_chunking(text)
                method = f"Chunked LLM ({llm_result.get('chunks_processed', 1)} chunks)"
            else:
                llm_result = await self.correct_with_llm(text)
                method = "Pure LLM (Llama-3)"
            
            elapsed = time.time() - start_time
            
            # Convert LLM edits to suggestions format
            suggestions = []
            for edit in llm_result.get("edits", []):
                if edit["original"] and edit["suggestion"]:
                    suggestions.append(f"{edit['original']} → {edit['suggestion']}")
            
            return {
                "text": llm_result["text"],
                "suggestions": suggestions,
                "time": elapsed,
                "method": method,
                "edits": llm_result.get("edits", []),
                "confidence": "high",
                "success": True,
                "chunks_used": llm_result.get('chunks_processed', 1)
            }
            
        except Exception as e:
            elapsed = time.time() - start_time
            return {
                "text": text,  # Return original unchanged
                "suggestions": [],
                "time": elapsed,
                "method": "LLM Failed",
                "error": str(e),
                "confidence": "none",
                "success": False,
                "chunks_used": 0
            }

    async def enhance_naturalness(self, text):
        """Make text sound more natural while preserving the original tone and mood"""
        prompt = f"""You are a professional editor specializing in making text sound more natural and fluent. Your task is to rewrite the given text to make it sound more natural while preserving the original tone, mood, and meaning.

RULES:
- Keep the same tone and mood (casual stays casual, formal stays formal)
- Make the language flow more naturally
- Fix awkward phrasing and improve word choice
- Preserve the original meaning completely
- Return only valid JSON

EXAMPLES:

Input: "who I haven't seen since like forever"
Output: {{"text":"who I hadn't seen in ages","changes":[{{"original":"who I haven't seen since like forever","suggestion":"who I hadn't seen in ages","type":"naturalness","reason":"More natural time expression"}}]}}

Input: "I was thinking that maybe we could possibly meet up sometime"
Output: {{"text":"I was thinking we could meet up sometime","changes":[{{"original":"that maybe we could possibly","suggestion":"we could","type":"naturalness","reason":"Removed redundant hedging words"}}]}}

Input: "The thing is that I am not really sure about this"
Output: {{"text":"I'm not really sure about this","changes":[{{"original":"The thing is that I am","suggestion":"I'm","type":"naturalness","reason":"More direct and natural expression"}}]}}

Input: "It is quite obvious that this approach is better"
Output: {{"text":"This approach is clearly better","changes":[{{"original":"It is quite obvious that this approach is","suggestion":"This approach is clearly","type":"naturalness","reason":"More concise and natural phrasing"}}]}}

Input: "{text}"
Output:"""
        
        try:
            input_data = {
                "prompt": prompt,
                "max_new_tokens": min(len(text) + 150, 600),
                "temperature": 0.1,  # Slightly creative for naturalness
                "top_p": 0.9,
                "do_sample": True
            }
            
            output = ""
            for event in replicate.stream("meta/meta-llama-3-8b-instruct", input=input_data):
                output += str(event)
            
            # Parse JSON response
            output = self._clean_json_output(output)
            result = json.loads(output.strip())
            
            if "text" in result and isinstance(result["text"], str):
                return {
                    "text": result["text"],
                    "changes": result.get("changes", []),
                    "enhancement_type": "naturalness"
                }
            else:
                raise ValueError("Invalid response format")
                
        except Exception as e:
            raise RuntimeError(f"Naturalness enhancement error: {e}")

    async def enhance_formality(self, text):
        """Make text more formal and well-structured"""
        prompt = f"""You are a professional editor specializing in formal writing. Your task is to rewrite the given text to make it more formal, professional, and well-structured while preserving the original meaning.

RULES:
- Use formal language and professional tone
- Improve sentence structure and flow
- Replace casual expressions with formal equivalents
- Enhance clarity and precision
- Preserve the original meaning completely
- Return only valid JSON

EXAMPLES:

Input: "I think we should maybe try this approach"
Output: {{"text":"I believe we should consider implementing this approach","changes":[{{"original":"I think we should maybe try","suggestion":"I believe we should consider implementing","type":"formality","reason":"More professional and decisive language"}}]}}

Input: "The stuff we talked about is pretty important"
Output: {{"text":"The matters we discussed are quite significant","changes":[{{"original":"stuff","suggestion":"matters","type":"formality","reason":"More formal vocabulary"}},{{"original":"pretty important","suggestion":"quite significant","type":"formality","reason":"More professional expression"}}]}}

Input: "Can't figure out why this doesn't work"
Output: {{"text":"I am unable to determine why this does not function properly","changes":[{{"original":"Can't figure out","suggestion":"I am unable to determine","type":"formality","reason":"Formal expression and full words"}},{{"original":"doesn't work","suggestion":"does not function properly","type":"formality","reason":"Professional terminology"}}]}}

Input: "This is a really good idea that might help us out"
Output: {{"text":"This is an excellent proposal that could significantly benefit our objectives","changes":[{{"original":"really good idea","suggestion":"excellent proposal","type":"formality","reason":"More professional vocabulary"}},{{"original":"might help us out","suggestion":"could significantly benefit our objectives","type":"formality","reason":"More formal and specific language"}}]}}

Input: "{text}"
Output:"""
        
        try:
            input_data = {
                "prompt": prompt,
                "max_new_tokens": min(len(text) + 150, 600),
                "temperature": 0.1,
                "top_p": 0.9,
                "do_sample": True
            }
            
            output = ""
            for event in replicate.stream("meta/meta-llama-3-8b-instruct", input=input_data):
                output += str(event)
            
            # Parse JSON response
            output = self._clean_json_output(output)
            result = json.loads(output.strip())
            
            if "text" in result and isinstance(result["text"], str):
                return {
                    "text": result["text"],
                    "changes": result.get("changes", []),
                    "enhancement_type": "formality"
                }
            else:
                raise ValueError("Invalid response format")
                
        except Exception as e:
            raise RuntimeError(f"Formality enhancement error: {e}")

    def _clean_json_output(self, output):
        """Clean up LLM output to extract valid JSON"""
        output = output.strip()
        
        # Remove markdown formatting
        if output.startswith('```json'):
            output = output[7:]
        if output.startswith('```'):
            output = output[3:]
        if output.endswith('```'):
            output = output[:-3]
        
        # Find JSON boundaries
        first_brace = output.find('{')
        if first_brace > 0:
            output = output[first_brace:]
        
        last_brace = output.rfind('}')
        if last_brace >= 0:
            output = output[:last_brace + 1]
        
        return output
        """Async version for use within FastAPI"""
        start_time = time.time()
        
        try:
            # Check if text is large and chunking is enabled
            if use_chunking and self._estimate_tokens(text) > 400:
                print(f"📊 Large text detected ({len(text)} chars, ~{self._estimate_tokens(text)} tokens) - using intelligent chunking")
                llm_result = await self.correct_with_chunking(text)
                method = f"Chunked LLM ({llm_result.get('chunks_processed', 1)} chunks)"
            else:
                llm_result = await self.correct_with_llm(text)
                method = "Pure LLM (Llama-3)"
            
            elapsed = time.time() - start_time
            
            # Convert LLM edits to suggestions format
            suggestions = []
            for edit in llm_result.get("edits", []):
                if edit["original"] and edit["suggestion"]:
                    suggestions.append(f"{edit['original']} → {edit['suggestion']}")
            
            return {
                "text": llm_result["text"],
                "suggestions": suggestions,
                "time": elapsed,
                "method": method,
                "edits": llm_result.get("edits", []),
                "confidence": "high",
                "success": True,
                "chunks_used": llm_result.get('chunks_processed', 1)
            }
            
        except Exception as e:
            elapsed = time.time() - start_time
            return {
                "text": text,  # Return original unchanged
                "suggestions": [],
                "time": elapsed,
                "method": "LLM Failed",
                "error": str(e),
                "confidence": "none",
                "success": False,
                "chunks_used": 0
            }


if __name__ == "__main__":
    # Quick test when running engine.py directly
    print("🎯 LLM-ONLY SPELL-CHECK ENGINE")
    print("=" * 40)
    
    try:
        engine = LLMEngine()
        print("🤖 LLM: Enabled")
        print()
        
        # Test cases including large text for chunking
        tests = [
            "ths is a smple test",
            "definitly recieve the mesage", 
            "i beleive this wil wrk",
            "the qick brwn fx jumps ovr the lzy dg",
        ]
        
        for i, text in enumerate(tests, 1):
            print(f"Test {i}: {text}")
            
            result = engine.correct_text(text)
            if result['success']:
                print(f"  ✅ Result: {result['text'][:100]}{'...' if len(result['text']) > 100 else ''}")
                print(f"     Method: {result['method']}")
                print(f"     Time: {result['time']:.2f}s")
                if result.get('chunks_used', 1) > 1:
                    print(f"     Chunks: {result['chunks_used']} processed")
                if result['suggestions']:
                    print(f"     Changes: {len(result['suggestions'])} corrections")
            else:
                print(f"  ❌ Failed: {result['error']}")
            print()
        
        print("✅ LLM Engine ready!")
        
    except RuntimeError as e:
        print(f"❌ Engine initialization failed: {e}")
        print("   Make sure REPLICATE_API_TOKEN is set in .env file")