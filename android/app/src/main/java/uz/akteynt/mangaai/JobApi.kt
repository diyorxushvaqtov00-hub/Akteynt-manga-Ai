package uz.akteynt.mangaai
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
data class JobState(val status:String,val progress:Int,val error:String?)
class JobApi(private val baseUrl:String){suspend fun get(id:String):JobState=withContext(Dispatchers.IO){val c=URL("$baseUrl/api/jobs/$id").openConnection() as HttpURLConnection;if(c.responseCode !in 200..299)error((c.errorStream?:c.inputStream).bufferedReader().readText());val b=c.inputStream.bufferedReader().readText();val s=Regex("""\"status\"\\s*:\\s*\"([^\"]+)\"""").find(b)?.groupValues?.get(1)? : "unknown";val p=Regex("""\"progress\"\\s*:\\s*(\\d+)""").find(b)?.groupValues?.get(1)?.toInt()?:0;val e=Regex("""\"error\"\\s*:\\s*\"([^\"]*)\"""").find(b)?.groupValues?.get(1);JobState(s,p,e)}}
