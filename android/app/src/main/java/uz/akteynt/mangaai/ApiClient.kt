package uz.akteynt.mangaai

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedOutputStream
import java.net.HttpURLConnection
import java.net.URL

data class UploadInit(val jobId: String, val storagePath: String)
class ApiClient(private val baseUrl: String) {
 suspend fun initUpload(name:String,size:Long,type:String):UploadInit=withContext(Dispatchers.IO){
  val c=(URL("$baseUrl/api/upload/init").openConnection() as HttpURLConnection).apply{requestMethod="POST";doOutput=true;setRequestProperty("Content-Type","application/json")}
  c.outputStream.use{it.write("{\"filename\":\"$name\",\"size\":$size,\"type\":\"$type\"}".toByteArray())}
  val t=(if(c.responseCode in 200..299)c.inputStream else c.errorStream).bufferedReader().readText();if(c.responseCode !in 200..299)error(t)
  val j=Regex("""\"jobId\"\\s*:\\s*\"([^\"]+)\"""").find(t)?.groupValues?.get(1)?:error("jobId yo'q")
  val p=Regex("""\"storagePath\"\\s*:\\s*\"([^\"]+)\"""").find(t)?.groupValues?.get(1)?:error("storagePath yo'q");UploadInit(j,p)
 }
 suspend fun uploadToStorage(context:Context,uri:Uri,path:String,key:String,supabaseUrl:String)=withContext(Dispatchers.IO){
  val input=context.contentResolver.openInputStream(uri)?:error("PDF ochilmadi")
  val c=(URL("$supabaseUrl/storage/v1/object/manga-files/$path").openConnection() as HttpURLConnection).apply{requestMethod="POST";doOutput=true;setRequestProperty("apikey",key);setRequestProperty("Authorization","Bearer $key");setRequestProperty("Content-Type","application/pdf");setRequestProperty("x-upsert","false")}
  input.use{i->BufferedOutputStream(c.outputStream).use{o->i.copyTo(o)}};if(c.responseCode !in 200..299)error((c.errorStream?:c.inputStream).bufferedReader().readText())
 }
 suspend fun finalizeUpload(jobId:String,name:String,path:String)=withContext(Dispatchers.IO){
  val c=(URL("$baseUrl/api/upload/finalize").openConnection() as HttpURLConnection).apply{requestMethod="POST";doOutput=true;setRequestProperty("Content-Type","application/json")};c.outputStream.use{it.write("{\"jobId\":\"$jobId\",\"filename\":\"$name\",\"storagePath\":\"$path\"}".toByteArray())};if(c.responseCode !in 200..299)error((c.errorStream?:c.inputStream).bufferedReader().readText())
 }
}
